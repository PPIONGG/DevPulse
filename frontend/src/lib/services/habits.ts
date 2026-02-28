import { api } from "@/lib/api/client";
import type { Habit, HabitInput, HabitCompletion } from "@/lib/types/database";

export async function getHabits(): Promise<Habit[]> {
  return api.get<Habit[]>("/api/habits");
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  return api.post<Habit>("/api/habits", input);
}

export async function updateHabit(
  id: string,
  input: HabitInput
): Promise<Habit> {
  return api.put<Habit>(`/api/habits/${id}`, input);
}

export async function archiveHabit(
  id: string,
  isArchived: boolean
): Promise<void> {
  await api.patch(`/api/habits/${id}/archive`, { is_archived: isArchived });
}

export async function deleteHabit(id: string): Promise<void> {
  await api.delete(`/api/habits/${id}`);
}

export async function getCompletions(
  startDate: string,
  endDate: string
): Promise<HabitCompletion[]> {
  return api.get<HabitCompletion[]>(
    `/api/habits/completions?start=${startDate}&end=${endDate}`
  );
}

export async function toggleCompletion(
  habitId: string,
  date: string
): Promise<{ completed: boolean }> {
  return api.post<{ completed: boolean }>(`/api/habits/${habitId}/toggle`, {
    date,
  });
}
