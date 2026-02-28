"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { PomodoroStats } from "@/components/pomodoro-stats";
import { PomodoroHistory } from "@/components/pomodoro-history";
import { PomodoroSettings } from "@/components/pomodoro-settings";
import { usePomodoro } from "@/hooks/use-pomodoro";

export default function PomodoroPage() {
  const {
    timerState,
    secondsLeft,
    totalSeconds,
    sessionCount,
    isRunning,
    taskLabel,
    setTaskLabel,
    start,
    pause,
    resume,
    reset,
    skip,
    config,
    updateConfig,
    sessions,
    stats,
    loading,
    error,
    deleteSession,
    clearSessions,
    refetch,
  } = usePomodoro();

  const [showSettings, setShowSettings] = useState(false);

  const isTimerActive = timerState !== "idle";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pomodoro Timer</h2>
          <p className="mt-1 text-muted-foreground">
            Focus with the Pomodoro Technique.
          </p>
        </div>
        <Button
          variant={showSettings ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="mr-2 size-4" />
          Settings
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {showSettings && (
        <PomodoroSettings
          config={config}
          onUpdateConfig={updateConfig}
          disabled={isTimerActive}
        />
      )}

      <PomodoroTimer
        timerState={timerState}
        secondsLeft={secondsLeft}
        totalSeconds={totalSeconds}
        sessionCount={sessionCount}
        sessionsBeforeLong={config.sessionsBeforeLong}
        isRunning={isRunning}
        taskLabel={taskLabel}
        onTaskLabelChange={setTaskLabel}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onReset={reset}
        onSkip={skip}
      />

      <PomodoroStats stats={stats} loading={loading} />

      <PomodoroHistory
        sessions={sessions}
        onDelete={deleteSession}
        onClearAll={clearSessions}
      />
    </div>
  );
}
