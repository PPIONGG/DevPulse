"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getDashboardStats,
  getDashboardRecent,
  type DashboardStats,
} from "@/lib/services/dashboard";
import { useAuth } from "@/providers/auth-provider";
import type { CodeSnippet } from "@/lib/types/database";

interface DashboardData {
  stats: DashboardStats;
  recentSnippets: CodeSnippet[];
}

const defaultStats: DashboardStats = {
  snippets: 0,
};

export function useDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData>({
    stats: defaultStats,
    recentSnippets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        getDashboardStats(),
        getDashboardRecent(),
      ]);

      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        const first = results[0] as PromiseRejectedResult;
        throw first.reason;
      }

      if (mountedRef.current) {
        const stats =
          results[0].status === "fulfilled"
            ? results[0].value
            : defaultStats;
        const recent =
          results[1].status === "fulfilled"
            ? results[1].value
            : { recentSnippets: [] };

        setData({
          stats,
          recentSnippets: recent.recentSnippets,
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
  }, [user, authLoading]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { ...data, loading, error, refetch: fetchDashboard };
}
