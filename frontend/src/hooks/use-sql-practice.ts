"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  getChallenges,
  getChallenge as getChallengeService,
  submitAnswer as submitAnswerService,
  getStats as getStatsService,
} from "@/lib/services/sql-practice";
import { useAuth } from "@/providers/auth-provider";
import type {
  SqlChallengeWithProgress,
  SqlChallengeDetail,
  SqlSubmitResult,
  SqlPracticeStats,
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
  const [result, setResult] = useState<SqlSubmitResult | null>(null);
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
        const res = await submitAnswerService({
          challenge_id: data.challenge.id,
          query,
        });
        if (mountedRef.current) {
          setResult(res);
          if (res.status === "correct") {
            toast.success("Correct answer!");
            // Refetch to update submissions and progress
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

  return {
    challenge: data?.challenge ?? null,
    submissions: data?.submissions ?? [],
    progress: data?.progress ?? null,
    loading,
    error,
    submitting,
    result,
    submit,
    refetch: fetchChallenge,
  };
}
