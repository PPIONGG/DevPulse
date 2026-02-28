import { api } from "@/lib/api/client";
import type {
  PomodoroSession,
  PomodoroSessionInput,
  PomodoroStats,
} from "@/lib/types/database";

export async function getPomodoroSessions(): Promise<PomodoroSession[]> {
  return api.get<PomodoroSession[]>("/api/pomodoro/sessions");
}

export async function createPomodoroSession(
  input: PomodoroSessionInput
): Promise<PomodoroSession> {
  return api.post<PomodoroSession>("/api/pomodoro/sessions", input);
}

export async function deletePomodoroSession(id: string): Promise<void> {
  await api.delete(`/api/pomodoro/sessions/${id}`);
}

export async function clearPomodoroSessions(): Promise<void> {
  await api.delete("/api/pomodoro/sessions");
}

export async function getPomodoroStats(): Promise<PomodoroStats> {
  return api.get<PomodoroStats>("/api/pomodoro/stats");
}
