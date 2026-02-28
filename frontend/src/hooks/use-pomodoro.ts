"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getPomodoroSessions,
  createPomodoroSession,
  deletePomodoroSession as deletePomodoroSessionService,
  clearPomodoroSessions as clearPomodoroSessionsService,
  getPomodoroStats,
} from "@/lib/services/pomodoro";
import { useAuth } from "@/providers/auth-provider";
import { DEFAULT_POMODORO_CONFIG } from "@/config/pomodoro";
import type { PomodoroSession, PomodoroStats } from "@/lib/types/database";

export type TimerState = "idle" | "work" | "break" | "longBreak";

export interface PomodoroConfig {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLong: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

const STORAGE_KEY = "devpulse-pomodoro-config";

function loadConfig(): PomodoroConfig {
  if (typeof window === "undefined") return { ...DEFAULT_POMODORO_CONFIG };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_POMODORO_CONFIG, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_POMODORO_CONFIG };
}

function saveConfig(config: PomodoroConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export function usePomodoro() {
  const { user, loading: authLoading } = useAuth();

  // Timer state (client-side only)
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [taskLabel, setTaskLabel] = useState("");

  // Config
  const [config, setConfig] = useState<PomodoroConfig>(loadConfig);

  // Persisted data
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const endTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStateRef = useRef<TimerState>(timerState);
  const configRef = useRef<PomodoroConfig>(config);
  const sessionCountRef = useRef<number>(sessionCount);
  const taskLabelRef = useRef<string>(taskLabel);

  // Keep refs in sync
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    sessionCountRef.current = sessionCount;
  }, [sessionCount]);
  useEffect(() => {
    taskLabelRef.current = taskLabel;
  }, [taskLabel]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // --- Data fetching ---
  const fetchData = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [sessionsData, statsData] = await Promise.allSettled([
        getPomodoroSessions(),
        getPomodoroStats(),
      ]);
      if (mountedRef.current) {
        if (sessionsData.status === "fulfilled") {
          setSessions(sessionsData.value);
        }
        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
        }
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch pomodoro data"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Notification helpers ---
  const requestNotificationPermission = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, { body });
    }
  }, []);

  // --- Timer completion handler ---
  const handleTimerComplete = useCallback(async () => {
    const currentState = timerStateRef.current;
    const cfg = configRef.current;
    const currentSessionCount = sessionCountRef.current;
    const currentTaskLabel = taskLabelRef.current;

    if (currentState === "work") {
      // Save completed work session to DB
      const targetDuration = cfg.workMinutes * 60;
      try {
        const created = await createPomodoroSession({
          duration: targetDuration,
          target_duration: targetDuration,
          task_label: currentTaskLabel,
        });
        if (mountedRef.current) {
          setSessions((prev) => [created, ...prev]);
          // Refresh stats
          try {
            const newStats = await getPomodoroStats();
            if (mountedRef.current) setStats(newStats);
          } catch {
            // stats refresh is best-effort
          }
        }
      } catch {
        toast.error("Failed to save focus session");
      }

      const newCount = currentSessionCount + 1;
      if (mountedRef.current) {
        setSessionCount(newCount);
      }

      // Determine next state
      const isLongBreak = newCount % cfg.sessionsBeforeLong === 0;
      const nextState: TimerState = isLongBreak ? "longBreak" : "break";
      const nextDuration = isLongBreak
        ? cfg.longBreakMinutes * 60
        : cfg.breakMinutes * 60;

      sendNotification("Pomodoro", "Time for a break!");

      if (mountedRef.current) {
        setTimerState(nextState);
        setSecondsLeft(nextDuration);

        if (cfg.autoStartBreaks) {
          endTimeRef.current = Date.now() + nextDuration * 1000;
          setIsRunning(true);
        } else {
          setIsRunning(false);
        }
      }
    } else {
      // Break or long break completed
      const nextDuration = cfg.workMinutes * 60;

      sendNotification("Pomodoro", "Back to work!");

      if (mountedRef.current) {
        // Reset session count after long break
        if (currentState === "longBreak") {
          setSessionCount(0);
        }

        setTimerState("work");
        setSecondsLeft(nextDuration);

        if (cfg.autoStartWork) {
          endTimeRef.current = Date.now() + nextDuration * 1000;
          setIsRunning(true);
        } else {
          setIsRunning(false);
        }
      }
    }
  }, [sendNotification]);

  // --- Interval tick ---
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000)
      );

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setSecondsLeft(0);
        setIsRunning(false);
        handleTimerComplete();
      } else {
        setSecondsLeft(remaining);
      }
    }, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, handleTimerComplete]);

  // --- Timer controls ---
  const start = useCallback(() => {
    requestNotificationPermission();
    const duration = config.workMinutes * 60;
    setTimerState("work");
    setSecondsLeft(duration);
    endTimeRef.current = Date.now() + duration * 1000;
    setIsRunning(true);
  }, [config.workMinutes, requestNotificationPermission]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    endTimeRef.current = Date.now() + secondsLeft * 1000;
    setIsRunning(true);
  }, [secondsLeft]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState("idle");
    setSecondsLeft(0);
    setIsRunning(false);
    setSessionCount(0);
  }, []);

  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setSecondsLeft(0);
    handleTimerComplete();
  }, [handleTimerComplete]);

  // --- Config ---
  const updateConfig = useCallback((partial: Partial<PomodoroConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...partial };
      saveConfig(updated);
      return updated;
    });
  }, []);

  // --- Session actions ---
  const deleteSession = useCallback(async (id: string) => {
    await deletePomodoroSessionService(id);
    if (mountedRef.current) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session deleted");
      try {
        const newStats = await getPomodoroStats();
        if (mountedRef.current) setStats(newStats);
      } catch {
        // stats refresh is best-effort
      }
    }
  }, []);

  const clearSessions = useCallback(async () => {
    await clearPomodoroSessionsService();
    if (mountedRef.current) {
      setSessions([]);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              today_sessions: 0,
              today_minutes: 0,
              week_sessions: 0,
              week_minutes: 0,
              total_sessions: 0,
              current_streak: 0,
            }
          : null
      );
      toast.success("History cleared");
    }
  }, []);

  // Compute total seconds for current timer phase
  const totalSeconds =
    timerState === "work"
      ? config.workMinutes * 60
      : timerState === "break"
        ? config.breakMinutes * 60
        : timerState === "longBreak"
          ? config.longBreakMinutes * 60
          : 0;

  return {
    // Timer state
    timerState,
    secondsLeft,
    totalSeconds,
    sessionCount,
    isRunning,
    taskLabel,
    setTaskLabel,

    // Timer controls
    start,
    pause,
    resume,
    reset,
    skip,

    // Config
    config,
    updateConfig,

    // Persisted data
    sessions,
    stats,
    loading,
    error,

    // Session actions
    deleteSession,
    clearSessions,
    refetch: fetchData,
  };
}
