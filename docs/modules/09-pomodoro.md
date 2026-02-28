# Module 09 — Pomodoro Timer

> Difficulty: ⭐⭐ | One new table | No new packages

## Overview

Focus timer using the Pomodoro Technique — work in focused intervals (default 25 minutes) separated by short breaks (5 minutes), with a longer break (15 minutes) every 4 sessions. Tracks completed focus sessions to DB with daily/weekly productivity stats. Timer runs entirely client-side; only completed sessions are persisted.

## PostgreSQL Migration

```sql
-- backend/database/migrations/013_create_pomodoro_sessions.up.sql

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,            -- actual focused seconds
    target_duration INTEGER NOT NULL,     -- configured work duration in seconds
    task_label TEXT NOT NULL DEFAULT '',   -- optional: what were you working on
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_completed_at ON pomodoro_sessions(completed_at DESC);
```

## Go Backend

### Model

```go
// backend/models/pomodoro.go

type PomodoroSession struct {
    ID             uuid.UUID `json:"id"`
    UserID         uuid.UUID `json:"user_id"`
    Duration       int       `json:"duration"`
    TargetDuration int       `json:"target_duration"`
    TaskLabel      string    `json:"task_label"`
    CompletedAt    time.Time `json:"completed_at"`
    CreatedAt      time.Time `json:"created_at"`
}

type PomodoroSessionInput struct {
    Duration       int    `json:"duration"`
    TargetDuration int    `json:"target_duration"`
    TaskLabel      string `json:"task_label"`
}

type PomodoroStats struct {
    TodaySessions    int     `json:"today_sessions"`
    TodayMinutes     float64 `json:"today_minutes"`
    WeekSessions     int     `json:"week_sessions"`
    WeekMinutes      float64 `json:"week_minutes"`
    TotalSessions    int     `json:"total_sessions"`
    CurrentStreak    int     `json:"current_streak"`     // consecutive days with ≥1 session
}
```

### Repository

```go
// backend/repository/pomodoro_repo.go

type PomodoroRepo struct { pool *pgxpool.Pool }

func (r *PomodoroRepo) ListByUser(ctx, userID, limit) ([]PomodoroSession, error)
// ORDER BY completed_at DESC, default limit 50

func (r *PomodoroRepo) Create(ctx, userID, input) (*PomodoroSession, error)

func (r *PomodoroRepo) Delete(ctx, userID, sessionID) error

func (r *PomodoroRepo) GetStats(ctx, userID) (*PomodoroStats, error)
// Uses SQL aggregation:
//   today_sessions/minutes:  WHERE completed_at >= CURRENT_DATE
//   week_sessions/minutes:   WHERE completed_at >= date_trunc('week', CURRENT_DATE)
//   total_sessions:          COUNT(*)
//   current_streak:          consecutive days with sessions (use generate_series or window fn)

func (r *PomodoroRepo) ClearAll(ctx, userID) error
```

### Handler

```go
// backend/handlers/pomodoro.go

type PomodoroHandler struct { repo *PomodoroRepo }

func (h *PomodoroHandler) List(w, r)     // GET  /api/pomodoro/sessions
func (h *PomodoroHandler) Create(w, r)   // POST /api/pomodoro/sessions
func (h *PomodoroHandler) Delete(w, r)   // DELETE /api/pomodoro/sessions/{id}
func (h *PomodoroHandler) ClearAll(w, r) // DELETE /api/pomodoro/sessions
func (h *PomodoroHandler) Stats(w, r)    // GET  /api/pomodoro/stats
```

### Routes

```go
// Add to backend/router/router.go

mux.Handle("GET /api/pomodoro/sessions", authMW(http.HandlerFunc(pomodoro.List)))
mux.Handle("POST /api/pomodoro/sessions", authMW(http.HandlerFunc(pomodoro.Create)))
mux.Handle("DELETE /api/pomodoro/sessions/{id}", authMW(http.HandlerFunc(pomodoro.Delete)))
mux.Handle("DELETE /api/pomodoro/sessions", authMW(http.HandlerFunc(pomodoro.ClearAll)))
mux.Handle("GET /api/pomodoro/stats", authMW(http.HandlerFunc(pomodoro.Stats)))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface PomodoroSession {
  id: string;
  user_id: string;
  duration: number;          // seconds
  target_duration: number;   // seconds
  task_label: string;
  completed_at: string;
  created_at: string;
}

export type PomodoroSessionInput = Pick<
  PomodoroSession,
  "duration" | "target_duration" | "task_label"
>;

export interface PomodoroStats {
  today_sessions: number;
  today_minutes: number;
  week_sessions: number;
  week_minutes: number;
  total_sessions: number;
  current_streak: number;
}
```

## Service Functions

```ts
// lib/services/pomodoro.ts

import { api } from "@/lib/api/client";
import type { PomodoroSession, PomodoroSessionInput, PomodoroStats } from "@/lib/types/database";

export async function getPomodoroSessions(): Promise<PomodoroSession[]> {
  return api.get<PomodoroSession[]>("/api/pomodoro/sessions");
}

export async function createPomodoroSession(input: PomodoroSessionInput): Promise<PomodoroSession> {
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
```

## Hook

```ts
// hooks/use-pomodoro.ts

export function usePomodoro() {
  return {
    // Timer state (client-side only)
    timerState: "idle" | "work" | "break" | "longBreak";
    secondsLeft: number;
    sessionCount: number;        // sessions completed in current cycle (resets after long break)
    isRunning: boolean;

    // Timer controls
    start: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    skip: () => void;            // skip current interval

    // Config (stored in localStorage)
    config: PomodoroConfig;
    updateConfig: (config: Partial<PomodoroConfig>) => void;

    // Persisted data
    sessions: PomodoroSession[];
    stats: PomodoroStats | null;
    loading: boolean;
    error: string | null;

    // Session actions
    deleteSession: (id: string) => Promise<void>;
    clearSessions: () => Promise<void>;
    refetch: () => Promise<void>;
  };
}

interface PomodoroConfig {
  workMinutes: number;       // default 25
  breakMinutes: number;      // default 5
  longBreakMinutes: number;  // default 15
  sessionsBeforeLong: number; // default 4
  autoStartBreaks: boolean;  // default true
  autoStartWork: boolean;    // default false
}
```

## Components

### PomodoroTimer

```
components/pomodoro-timer.tsx
```

Main timer widget:
- Large circular progress ring showing time remaining
- Digital countdown display (MM:SS) in the center
- Current state label (Focus / Break / Long Break)
- Control buttons: Start, Pause, Resume, Reset, Skip
- Session dots showing progress toward long break (e.g., ●●○○ = 2/4 sessions)
- Optional task label input (what are you working on?)
- Audio notification (browser Notification API) when timer completes

### PomodoroStats

```
components/pomodoro-stats.tsx
```

- Stats cards: Today (sessions + minutes), This Week (sessions + minutes), Streak (days)
- Compact bar chart or sparkline showing sessions per day for the last 7 days
- Computed from `PomodoroStats` API response

### PomodoroHistory

```
components/pomodoro-history.tsx
```

- List of completed sessions grouped by date
- Each entry: task label (or "Focus session"), duration, completed time
- Delete button per session
- "Clear All" with confirmation dialog

### PomodoroSettings

```
components/pomodoro-settings.tsx
```

- Inline settings panel (not a separate page)
- Number inputs: work duration, break duration, long break duration, sessions before long break
- Toggle switches: auto-start breaks, auto-start work
- Stored in `localStorage` (no DB — config is per-device)

### Skeleton

```ts
// Add to components/skeletons.tsx

export function PomodoroStatsSkeleton() {
  // 3 stat cards in a row with number + label
}
```

## Page Layout

```
app/(app)/pomodoro/page.tsx
```

```
┌──────────────────────────────────────────────────┐
│ Pomodoro Timer                          [⚙ Settings] │
├──────────────────────────────────────────────────┤
│                                                  │
│         ┌─────────────────────┐                  │
│         │                     │                  │
│         │      ╭───────╮      │                  │
│         │      │ 24:37 │      │                  │
│         │      │ Focus │      │                  │
│         │      ╰───────╯      │                  │
│         │    ●●○○  (2/4)      │                  │
│         │                     │                  │
│         │  [Task label...  ]  │                  │
│         │                     │                  │
│         │ [Start] [Reset]     │                  │
│         └─────────────────────┘                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  Today        This Week       Streak             │
│  4 sessions   12 sessions     5 days             │
│  100 min      300 min                            │
├──────────────────────────────────────────────────┤
│ Session History                    [Clear All]   │
│ ─── Today ───                                    │
│  Focus session          25 min     2:30 PM       │
│  Fix auth bug           25 min     2:00 PM       │
│  Fix auth bug           25 min     1:30 PM       │
│ ─── Yesterday ───                                │
│  API refactor           25 min     4:00 PM       │
└──────────────────────────────────────────────────┘
```

- Timer widget centered at top
- Stats row below timer
- Session history below stats (scrollable)
- Settings panel as collapsible section or sheet

## Navigation

```ts
// In config/navigation.ts
import { Timer } from "lucide-react";

{
  title: "Pomodoro",
  href: "/pomodoro",
  icon: Timer,
}
```

## Config Files

```ts
// config/pomodoro.ts

export const DEFAULT_POMODORO_CONFIG = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
  autoStartBreaks: true,
  autoStartWork: false,
} as const;

export const POMODORO_LIMITS = {
  minWork: 1,
  maxWork: 90,
  minBreak: 1,
  maxBreak: 30,
  minLongBreak: 5,
  maxLongBreak: 60,
  minSessions: 2,
  maxSessions: 8,
} as const;
```

## npm Packages

None needed.

## Logic Notes

### Timer Implementation

- Use `setInterval` at 1-second tick in a `useEffect`
- Store `endTime = Date.now() + secondsLeft * 1000` for drift-proof timing
- On each tick: `secondsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))`
- When `secondsLeft` reaches 0:
  1. Play notification sound / browser notification
  2. If was "work" → save session to DB → increment `sessionCount`
  3. Auto-transition: work → break (or longBreak if `sessionCount % sessionsBeforeLong === 0`)
  4. If `autoStartBreaks`/`autoStartWork`, start next interval automatically

### Browser Notifications

```ts
// Request permission on first start
if (Notification.permission === "default") {
  Notification.requestPermission();
}

// On timer complete
if (Notification.permission === "granted") {
  new Notification("Pomodoro", {
    body: timerState === "work" ? "Time for a break!" : "Back to work!",
  });
}
```

### Circular Progress Ring

```tsx
// SVG circle with stroke-dasharray / stroke-dashoffset
const circumference = 2 * Math.PI * radius;
const progress = secondsLeft / totalSeconds;
const offset = circumference * (1 - progress);

<circle
  r={radius}
  strokeDasharray={circumference}
  strokeDashoffset={offset}
  className="transition-all duration-1000 ease-linear"
/>
```

### Config Persistence

- Stored in `localStorage` under key `devpulse-pomodoro-config`
- Loaded on mount with fallback to `DEFAULT_POMODORO_CONFIG`
- Updated via `updateConfig()` which merges partial updates

### Streak Calculation (Backend SQL)

```sql
-- Count consecutive days (including today) with at least 1 session
WITH daily AS (
  SELECT DISTINCT DATE(completed_at) as d
  FROM pomodoro_sessions
  WHERE user_id = $1
  ORDER BY d DESC
),
streaks AS (
  SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int AS grp
  FROM daily
)
SELECT COUNT(*) as streak
FROM streaks
WHERE grp = (SELECT grp FROM streaks WHERE d = CURRENT_DATE);
-- Returns 0 if no session today
```
