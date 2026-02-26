import type { SupabaseClient } from "@supabase/supabase-js";
import type { CodeSnippet, WorkLog } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export interface DashboardStats {
  snippets: number;
  workLogs: number;
  articles: number;
  bookmarks: number;
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardStats> {
  const [snippets, workLogs, articles, bookmarks] = await Promise.allSettled([
    withTimeout(
      supabase
        .from("snippets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
    ),
    withTimeout(
      supabase
        .from("work_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
    ),
    withTimeout(
      supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
    ),
    withTimeout(
      supabase
        .from("bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
    ),
  ]);

  return {
    snippets:
      snippets.status === "fulfilled" ? (snippets.value.count ?? 0) : 0,
    workLogs:
      workLogs.status === "fulfilled" ? (workLogs.value.count ?? 0) : 0,
    articles:
      articles.status === "fulfilled" ? (articles.value.count ?? 0) : 0,
    bookmarks:
      bookmarks.status === "fulfilled" ? (bookmarks.value.count ?? 0) : 0,
  };
}

export async function getRecentSnippets(
  supabase: SupabaseClient,
  userId: string
): Promise<CodeSnippet[]> {
  const { data, error } = await withTimeout(
    supabase
      .from("snippets")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5)
  );
  if (error) throw error;
  return data ?? [];
}

export async function getRecentWorkLogs(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkLog[]> {
  const { data, error } = await withTimeout(
    supabase
      .from("work_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(5)
  );
  if (error) throw error;
  return data ?? [];
}

export async function getWeeklyHours(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { data, error } = await withTimeout(
    supabase
      .from("work_logs")
      .select("hours_spent")
      .eq("user_id", userId)
      .gte("date", weekStart.toISOString().split("T")[0])
  );
  if (error) throw error;

  return (data ?? []).reduce(
    (sum, row) => sum + (row.hours_spent ?? 0),
    0
  );
}
