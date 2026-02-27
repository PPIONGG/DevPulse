import { api } from "@/lib/api/client";
import type { CodeSnippet, WorkLog } from "@/lib/types/database";

export interface DashboardStats {
  snippets: number;
  workLogs: number;
  articles: number;
  bookmarks: number;
}

export interface DashboardRecent {
  recentSnippets: CodeSnippet[];
  recentWorkLogs: WorkLog[];
  weeklyHours: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return api.get<DashboardStats>("/api/dashboard/stats");
}

export async function getDashboardRecent(): Promise<DashboardRecent> {
  return api.get<DashboardRecent>("/api/dashboard/recent");
}
