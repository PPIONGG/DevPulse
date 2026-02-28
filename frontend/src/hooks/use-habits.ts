"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  getHabits,
  createHabit as createHabitService,
  updateHabit as updateHabitService,
  archiveHabit as archiveHabitService,
  deleteHabit as deleteHabitService,
  getCompletions,
  toggleCompletion as toggleCompletionService,
} from "@/lib/services/habits";
import { useAuth } from "@/providers/auth-provider";
import type {
  Habit,
  HabitInput,
  HabitCompletion,
  HabitWithStats,
} from "@/lib/types/database";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function isApplicable(d: Date, frequency: string): boolean {
  if (frequency === "weekdays") return isWeekday(d);
  return true; // daily and weekly
}

function calculateCurrentStreak(
  completionDates: Set<string>,
  frequency: string
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const d = new Date(today);

  // If today is not applicable, start from yesterday
  if (!isApplicable(d, frequency)) {
    d.setDate(d.getDate() - 1);
  }

  // If today is applicable but not completed, check from yesterday
  if (!completionDates.has(dateStr(d))) {
    d.setDate(d.getDate() - 1);
  }

  // Count backwards
  while (true) {
    // Skip non-applicable days
    while (!isApplicable(d, frequency) && d.getTime() > today.getTime() - 365 * 86400000) {
      d.setDate(d.getDate() - 1);
    }
    if (completionDates.has(dateStr(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calculateLongestStreak(
  completionDates: Set<string>,
  frequency: string
): number {
  if (completionDates.size === 0) return 0;

  const sorted = [...completionDates].sort();
  let longest = 0;
  let current = 0;
  let prev: Date | null = null;

  for (const ds of sorted) {
    const d = new Date(ds + "T00:00:00");
    if (!isApplicable(d, frequency)) continue;

    if (prev === null) {
      current = 1;
    } else {
      // Check if consecutive (accounting for non-applicable days)
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      while (!isApplicable(next, frequency) && next < d) {
        next.setDate(next.getDate() + 1);
      }
      if (dateStr(next) === ds) {
        current++;
      } else {
        current = 1;
      }
    }
    if (current > longest) longest = current;
    prev = d;
  }
  return longest;
}

function calculateCompletionRate(
  completionDates: Set<string>,
  frequency: string
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let applicable = 0;
  let completed = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (isApplicable(d, frequency)) {
      applicable++;
      if (completionDates.has(dateStr(d))) completed++;
    }
  }
  return applicable > 0 ? Math.round((completed / applicable) * 100) : 0;
}

function enrichHabit(
  habit: Habit,
  completions: HabitCompletion[]
): HabitWithStats {
  const habitCompletions = completions.filter(
    (c) => c.habit_id === habit.id
  );
  const dates = new Set(habitCompletions.map((c) => c.completed_date));

  return {
    ...habit,
    completions: habitCompletions,
    currentStreak: calculateCurrentStreak(dates, habit.frequency),
    longestStreak: calculateLongestStreak(dates, habit.frequency),
    completionRate: calculateCompletionRate(dates, habit.frequency),
  };
}

export function useHabits() {
  const { user, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 90);

      const [habitsData, completionsData] = await Promise.all([
        getHabits(),
        getCompletions(dateStr(start), todayStr()),
      ]);
      if (mountedRef.current) {
        setHabits(habitsData);
        setCompletions(completionsData);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch habits"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enrichedHabits = useMemo(
    () => habits.map((h) => enrichHabit(h, completions)),
    [habits, completions]
  );

  const createHabit = useCallback(
    async (input: HabitInput) => {
      if (!user) return;
      const created = await createHabitService(input);
      if (mountedRef.current) {
        setHabits((prev) => [...prev, created]);
        toast.success("Habit created");
      }
      return created;
    },
    [user]
  );

  const updateHabit = useCallback(
    async (id: string, input: HabitInput) => {
      const updated = await updateHabitService(id, input);
      if (mountedRef.current) {
        setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
        toast.success("Habit updated");
      }
      return updated;
    },
    []
  );

  const archiveHabit = useCallback(async (id: string, archived: boolean) => {
    await archiveHabitService(id, archived);
    if (mountedRef.current) {
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, is_archived: archived } : h))
      );
      toast.success(archived ? "Habit archived" : "Habit unarchived");
    }
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    await deleteHabitService(id);
    if (mountedRef.current) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setCompletions((prev) => prev.filter((c) => c.habit_id !== id));
      toast.success("Habit deleted");
    }
  }, []);

  const toggleCompletion = useCallback(
    async (habitId: string, date: string) => {
      const existing = completions.find(
        (c) => c.habit_id === habitId && c.completed_date === date
      );

      // Optimistic update
      if (existing) {
        setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
      } else {
        const temp: HabitCompletion = {
          id: `temp-${Date.now()}`,
          habit_id: habitId,
          completed_date: date,
          created_at: new Date().toISOString(),
        };
        setCompletions((prev) => [...prev, temp]);
      }

      try {
        await toggleCompletionService(habitId, date);
        // Refresh completions to get real IDs
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 90);
        const fresh = await getCompletions(dateStr(start), todayStr());
        if (mountedRef.current) {
          setCompletions(fresh);
        }
      } catch {
        // Revert
        if (mountedRef.current) {
          if (existing) {
            setCompletions((prev) => [...prev, existing]);
          } else {
            setCompletions((prev) =>
              prev.filter(
                (c) =>
                  !(c.habit_id === habitId && c.completed_date === date)
              )
            );
          }
          toast.error("Failed to toggle completion");
        }
      }
    },
    [completions]
  );

  return {
    habits: enrichedHabits,
    loading,
    error,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    toggleCompletion,
    refetch: fetchData,
  };
}
