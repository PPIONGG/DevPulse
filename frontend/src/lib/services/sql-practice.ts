import { api } from "@/lib/api/client";
import type {
  SqlChallengeWithProgress,
  SqlChallengeDetail,
  SqlSubmitRequest,
  SqlSubmitResult,
  SqlPracticeStats,
  SqlSubmission,
} from "@/lib/types/database";

export async function getChallenges(): Promise<SqlChallengeWithProgress[]> {
  return api.get<SqlChallengeWithProgress[]>("/api/sql-practice/challenges");
}

export async function getChallenge(slug: string): Promise<SqlChallengeDetail> {
  return api.get<SqlChallengeDetail>(`/api/sql-practice/challenges/${slug}`);
}

export async function submitAnswer(req: SqlSubmitRequest): Promise<SqlSubmitResult> {
  return api.post<SqlSubmitResult>("/api/sql-practice/submit", req, 65_000);
}

export async function runQuery(req: SqlSubmitRequest): Promise<SqlSubmitResult> {
  return api.post<SqlSubmitResult>("/api/sql-practice/run", req, 65_000);
}

export async function getStats(): Promise<SqlPracticeStats> {
  return api.get<SqlPracticeStats>("/api/sql-practice/stats");
}

export async function getSubmissions(challengeId: string): Promise<SqlSubmission[]> {
  return api.get<SqlSubmission[]>(`/api/sql-practice/submissions/${challengeId}`);
}

export async function previewTable(slug: string, tableName: string): Promise<QueryResult> {
  return api.get<QueryResult>(`/api/sql-practice/challenges/${slug}/preview/${tableName}`);
}

export async function explainQuery(req: SqlSubmitRequest): Promise<{ plan: string }> {
  return api.post<{ plan: string }>("/api/sql-practice/explain", req);
}

export async function getTopSolutions(challengeId: string): Promise<SqlTopSolution[]> {
  return api.get<SqlTopSolution[]>(`/api/sql-practice/top-solutions/${challengeId}`);
}
