import { api } from "@/lib/api/client";
import type { CodeSnippet } from "@/lib/types/database";

export interface DashboardStats {
  snippets: number;
  expenses: number;
  habits: number;
  boards: number;
}

export interface DashboardRecent {
  recentSnippets: CodeSnippet[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return api.get<DashboardStats>("/api/dashboard/stats");
}

export async function getDashboardRecent(): Promise<DashboardRecent> {
  return api.get<DashboardRecent>("/api/dashboard/recent");
}
