# Module 06 — Habit Tracker

> Difficulty: ⭐⭐⭐ | Two new tables | No new packages

## Overview

Track daily habits with a visual streak calendar. Define habits with target frequency (daily, weekdays, weekly), mark them complete each day, and see streaks and completion rates. The main view is a calendar/grid showing completion status per day.

## Supabase SQL

```sql
-- Habits definition table
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  color TEXT DEFAULT '#3b82f6' NOT NULL,
  frequency TEXT DEFAULT 'daily' NOT NULL CHECK (frequency IN ('daily', 'weekdays', 'weekly')),
  target_days INTEGER DEFAULT 1 NOT NULL,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habit completions (one row per habit per day completed)
CREATE TABLE habit_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Habits RLS
CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);

-- Habit completions RLS (through habit ownership)
CREATE POLICY "Users can view own habit completions"
  ON habit_completions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own habit completions"
  ON habit_completions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own habit completions"
  ON habit_completions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()
  ));

CREATE UNIQUE INDEX idx_habit_completions_unique ON habit_completions(habit_id, completed_date);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date);
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string;
  color: string;
  frequency: "daily" | "weekdays" | "weekly";
  target_days: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type HabitInput = Pick<
  Habit,
  "title" | "description" | "color" | "frequency" | "target_days"
>;

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
}

// Enriched habit with computed data (used in the hook)
export interface HabitWithStats extends Habit {
  completions: HabitCompletion[];
  currentStreak: number;
  longestStreak: number;
  completionRate: number;  // 0-100
}
```

## Service Functions

```ts
// lib/services/habits.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Habit, HabitInput, HabitCompletion } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getHabits(
  supabase: SupabaseClient,
  userId: string
): Promise<Habit[]>;
// Order by created_at ASC (oldest first — stable order)

export async function createHabit(
  supabase: SupabaseClient,
  userId: string,
  input: HabitInput
): Promise<Habit>;

export async function updateHabit(
  supabase: SupabaseClient,
  habitId: string,
  input: Partial<HabitInput & { is_archived: boolean }>
): Promise<Habit>;

export async function deleteHabit(
  supabase: SupabaseClient,
  habitId: string
): Promise<void>;

export async function getCompletions(
  supabase: SupabaseClient,
  habitIds: string[],
  startDate: string,
  endDate: string
): Promise<HabitCompletion[]>;
// Fetch completions for multiple habits within a date range

export async function toggleCompletion(
  supabase: SupabaseClient,
  habitId: string,
  date: string
): Promise<{ completed: boolean }>;
// If completion exists for this habit+date, delete it (uncomplete)
// If it doesn't exist, insert it (complete)
// Return whether it's now completed
```

## Hook

```ts
// hooks/use-habits.ts

export function useHabits() {
  return {
    habits: HabitWithStats[];
    loading: boolean;
    error: string | null;
    createHabit: (input: HabitInput) => Promise<Habit | undefined>;
    updateHabit: (id: string, input: Partial<HabitInput>) => Promise<Habit | undefined>;
    deleteHabit: (id: string) => Promise<void>;
    archiveHabit: (id: string) => Promise<void>;
    toggleCompletion: (habitId: string, date: string) => Promise<void>;  // optimistic
    refetch: () => Promise<void>;
  };
}
```

The hook:
1. Fetches all habits
2. Fetches completions for the last 90 days
3. Computes streaks and completion rates client-side
4. Returns enriched `HabitWithStats[]`

## Components

### HabitCard

```
components/habit-card.tsx
```

- Displays: title, description, frequency badge, current streak, completion rate
- Color indicator (left border or dot using habit's color)
- Today's completion toggle (checkbox/circle button)
- Mini calendar grid (last 7 or 30 days) showing completed days as filled squares
- Actions: edit, archive, delete

### HabitForm

```
components/habit-form.tsx
```

Dialog form with fields:
- Title (text input, required)
- Description (textarea, optional)
- Color (color picker — 8 preset colors to choose from)
- Frequency (select: daily, weekdays, weekly)
- Target Days per Week (number input, 1-7, only shown for "weekly" frequency)

### HabitCalendar

```
components/habit-calendar.tsx
```

- Grid view showing the last 30/90 days
- Each cell is a day — colored if completed, gray if missed, no color if not applicable (e.g., weekends for "weekdays" frequency)
- Clickable cells to toggle completion for past days
- GitHub contribution graph style

### Skeleton

```ts
// Add to components/skeletons.tsx

export function HabitCardSkeleton() {
  // Card with: title, frequency badge, streak number, mini calendar grid
}
```

## Page Layout

```
app/(app)/habits/page.tsx
```

```
┌──────────────────────────────────────────┐
│ Habits                     [+ New Habit] │
├──────────────────────────────────────────┤
│ Today's Habits                           │
│ ┌────────────────────────────────────┐   │
│ │ [●] Exercise        🔥 12 day streak│  │
│ │     ■■■□■■■□■■■■■■□■■■■ (last 20d)│   │
│ ├────────────────────────────────────┤   │
│ │ [○] Read 30 min     🔥 0 (missed!) │  │
│ │     ■■■■□□■■■□□■■■□□□□□ (last 20d)│   │
│ ├────────────────────────────────────┤   │
│ │ [●] Code review     🔥 5 day streak│  │
│ │     ■■■■■□□■■■■■□□■■■■■ (last 20d)│   │
│ └────────────────────────────────────┘   │
├──────────────────────────────────────────┤
│ [Show Archived]                          │
└──────────────────────────────────────────┘
```

- List of habit cards (single column — habits are wide)
- Each card has a completion toggle for today and mini calendar
- Toggle to show/hide archived habits
- No search needed (users typically have < 20 habits)

## Navigation

```ts
// In config/navigation.ts
import { Target } from "lucide-react";

{
  title: "Habits",
  href: "/habits",
  icon: Target,
}
```

## Config Files

```ts
// config/habit-colors.ts

export const habitColors = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#f97316", label: "Orange" },
] as const;
```

## npm Packages

None needed.

## Logic Notes

### Streak Calculation

```ts
function calculateCurrentStreak(
  completions: HabitCompletion[],
  frequency: "daily" | "weekdays" | "weekly"
): number {
  // Sort completions by date DESC
  // Starting from today (or yesterday if today isn't done yet),
  // count consecutive applicable days that have completions
  // "applicable" depends on frequency:
  //   - daily: every day
  //   - weekdays: Mon-Fri only
  //   - weekly: at least target_days per week
}
```

- Current streak: consecutive days/weeks with completion from today backwards
- Longest streak: max consecutive run in all completions
- Completion rate: (completed applicable days / total applicable days in last 30 days) * 100

### Applicable Days

- **daily**: every day counts
- **weekdays**: only Mon-Fri count (skip Sat/Sun)
- **weekly**: check if target_days completions exist per week

### Toggle Completion (Optimistic)

1. If date has completion → optimistically remove it from local state
2. If date has no completion → optimistically add it to local state
3. Call `toggleCompletion` service
4. On error, revert and show `toast.error()`
5. Recalculate streaks after toggle
