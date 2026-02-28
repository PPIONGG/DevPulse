"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  getChallenges,
  getChallenge as getChallengeService,
  submitAnswer as submitAnswerService,
  runQuery as runQueryService,
  getStats as getStatsService,
  previewTable as previewTableService,
  explainQuery as explainQueryService,
  getTopSolutions as getTopSolutionsService,
  getLessons,
  getLesson as getLessonService,
  runLessonQuery,
  completeLesson,
} from "@/lib/services/sql-practice";
import { useAuth } from "@/providers/auth-provider";
import type {
  SqlChallengeWithProgress,
  SqlChallengeDetail,
  SqlSubmitResult,
  SqlPracticeStats,
  QueryResult,
  SqlTopSolution,
  SqlModuleWithLessons,
  SqlLesson,
} from "@/lib/types/database";

export function useSqlPractice() {
  const { user, loading: authLoading } = useAuth();
  const [challenges, setChallenges] = useState<SqlChallengeWithProgress[]>([]);
  const [stats, setStats] = useState<SqlPracticeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [challengeData, statsData] = await Promise.all([
        getChallenges(),
        getStatsService(),
      ]);
      if (mountedRef.current) {
        setChallenges(challengeData);
        setStats(statsData);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch challenges");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    let result = challenges;
    if (difficultyFilter !== "all") {
      result = result.filter((c) => c.difficulty === difficultyFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }
    if (statusFilter === "solved") {
      result = result.filter((c) => c.progress?.is_solved);
    } else if (statusFilter === "unsolved") {
      result = result.filter((c) => !c.progress?.is_solved);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    return result;
  }, [challenges, difficultyFilter, categoryFilter, statusFilter, search]);

  return {
    challenges: filtered,
    allChallenges: challenges,
    stats,
    loading,
    error,
    difficultyFilter,
    setDifficultyFilter,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    refetch: fetchData,
  };
}

export function useSqlChallenge(slug: string) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<SqlChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SqlSubmitResult | null>(null);
  const [resultIsPreview, setResultIsPreview] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchChallenge = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const detail = await getChallengeService(slug);
      if (mountedRef.current) {
        setData(detail);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch challenge");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading, slug]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const submit = useCallback(
    async (query: string) => {
      if (!data || !user) return;
      try {
        setSubmitting(true);
        setResult(null);
        setResultIsPreview(false);
        const res = await submitAnswerService({
          challenge_id: data.challenge.id,
          query,
        });
        if (mountedRef.current) {
          setResult(res);
          if (res.status === "correct") {
            toast.success("Correct answer!");
            fetchChallenge();
          }
        }
        return res;
      } catch (err) {
        if (mountedRef.current) {
          toast.error(err instanceof Error ? err.message : "Failed to submit");
        }
      } finally {
        if (mountedRef.current) setSubmitting(false);
      }
    },
    [data, user, fetchChallenge]
  );

  const run = useCallback(
    async (query: string) => {
      if (!data || !user) return;
      try {
        setRunning(true);
        setResult(null);
        setResultIsPreview(true);
        const res = await runQueryService({
          challenge_id: data.challenge.id,
          query,
        });
        if (mountedRef.current) {
          setResult(res);
        }
        return res;
      } catch (err) {
        if (mountedRef.current) {
          toast.error(err instanceof Error ? err.message : "Failed to run query");
        }
      } finally {
        if (mountedRef.current) setRunning(false);
      }
    },
    [data, user]
  );

  const previewTable = useCallback(
    async (tableName: string) => {
      try {
        return await previewTableService(slug, tableName);
      } catch (err) {
        toast.error("Failed to preview table");
        throw err;
      }
    },
    [slug]
  );

  const explain = useCallback(
    async (query: string) => {
      if (!data) return;
      try {
        const res = await explainQueryService({
          challenge_id: data.challenge.id,
          query,
        });
        return res.plan;
      } catch (err) {
        toast.error("Failed to explain query");
        throw err;
      }
    },
    [data]
  );

  const getTopSolutions = useCallback(async () => {
    if (!data) return [];
    try {
      return await getTopSolutionsService(data.challenge.id);
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [data]);

  return {
    challenge: data?.challenge ?? null,
    submissions: data?.submissions ?? [],
    progress: data?.progress ?? null,
    prevSlug: data?.prev_slug ?? "",
    nextSlug: data?.next_slug ?? "",
    solutionSql: data?.solution_sql ?? null,
    loading,
    error,
    submitting,
    running,
    result,
    resultIsPreview,
    submit,
    run,
    previewTable,
    explain,
    getTopSolutions,
    refetch: fetchChallenge,
  };
}

export function useSqlAcademy() {
  const { user } = useAuth();
  const [modules, setModules] = useState<SqlModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getLessons();
      if (mountedRef.current) {
        setModules(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch lessons");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    modules,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useSqlAcademyLesson(id: string) {
  const { user } = useAuth();
  const [lesson, setLesson] = useState<SqlLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SqlSubmitResult | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchLesson = useCallback(async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const data = await getLessonService(id);
      if (mountedRef.current) {
        setLesson(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch lesson");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const run = useCallback(async (query: string) => {
    if (!id) return;
    try {
      setRunning(true);
      setResult(null);
      const res = await runLessonQuery(id, query);
      if (mountedRef.current) {
        setResult(res);
        if (res.status === "correct") {
          await completeLesson(id);
          // Optional: refresh lesson to update is_completed
          setLesson(prev => prev ? { ...prev, is_completed: true } : null);
        }
      }
      return res;
    } catch (err) {
      toast.error("Failed to run query");
    } finally {
      if (mountedRef.current) setRunning(false);
    }
  }, [id]);

  return {
    lesson,
    loading,
    error,
    running,
    result,
    run,
    refetch: fetchLesson,
  };
}
