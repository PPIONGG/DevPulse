"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getDashboardStats,
  getRecentSnippets,
  getRecentWorkLogs,
  getWeeklyHours,
  type DashboardStats,
} from "@/lib/services/dashboard";
import { useAuth } from "@/providers/auth-provider";
import type { CodeSnippet, WorkLog } from "@/lib/types/database";

interface DashboardData {
  stats: DashboardStats;
  recentSnippets: CodeSnippet[];
  recentWorkLogs: WorkLog[];
  weeklyHours: number;
}

const defaultStats: DashboardStats = {
  snippets: 0,
  workLogs: 0,
  articles: 0,
  bookmarks: 0,
};

export function useDashboard() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<DashboardData>({
    stats: defaultStats,
    recentSnippets: [],
    recentWorkLogs: [],
    weeklyHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        getDashboardStats(supabase, user.id),
        getRecentSnippets(supabase, user.id),
        getRecentWorkLogs(supabase, user.id),
        getWeeklyHours(supabase, user.id),
      ]);

      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        const first = results[0] as PromiseRejectedResult;
        throw first.reason;
      }

      if (mountedRef.current) {
        setData({
          stats:
            results[0].status === "fulfilled"
              ? results[0].value
              : defaultStats,
          recentSnippets:
            results[1].status === "fulfilled" ? results[1].value : [],
          recentWorkLogs:
            results[2].status === "fulfilled" ? results[2].value : [],
          weeklyHours:
            results[3].status === "fulfilled" ? results[3].value : 0,
        });

        const hasPartialError = results.some((r) => r.status === "rejected");
        setError(
          hasPartialError
            ? "Some dashboard data could not be loaded"
            : null
        );
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch dashboard"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { ...data, loading, error, refetch: fetchDashboard };
}
