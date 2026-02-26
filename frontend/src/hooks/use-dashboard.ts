"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const [stats, recentSnippets, recentWorkLogs, weeklyHours] =
        await Promise.all([
          getDashboardStats(supabase, user.id),
          getRecentSnippets(supabase, user.id),
          getRecentWorkLogs(supabase, user.id),
          getWeeklyHours(supabase, user.id),
        ]);
      setData({ stats, recentSnippets, recentWorkLogs, weeklyHours });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { ...data, loading, error, refetch: fetchDashboard };
}
