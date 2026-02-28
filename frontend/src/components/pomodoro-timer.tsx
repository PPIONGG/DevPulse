"use client";

import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n";
import type { TimerState } from "@/hooks/use-pomodoro";

interface PomodoroTimerProps {
  timerState: TimerState;
  secondsLeft: number;
  totalSeconds: number;
  sessionCount: number;
  sessionsBeforeLong: number;
  isRunning: boolean;
  taskLabel: string;
  onTaskLabelChange: (label: string) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getStateLabel(state: TimerState, t: (key: TranslationKey) => string): string {
  switch (state) {
    case "work":
      return t("pomodoro.focus");
    case "break":
      return t("pomodoro.break");
    case "longBreak":
      return t("pomodoro.longBreak");
    default:
      return t("pomodoro.ready");
  }
}

function getStateColor(state: TimerState): string {
  switch (state) {
    case "work":
      return "text-primary";
    case "break":
      return "text-emerald-500";
    case "longBreak":
      return "text-blue-500";
    default:
      return "text-muted-foreground";
  }
}

function getStrokeColor(state: TimerState): string {
  switch (state) {
    case "work":
      return "stroke-primary";
    case "break":
      return "stroke-emerald-500";
    case "longBreak":
      return "stroke-blue-500";
    default:
      return "stroke-muted-foreground/30";
  }
}

export function PomodoroTimer({
  timerState,
  secondsLeft,
  totalSeconds,
  sessionCount,
  sessionsBeforeLong,
  isRunning,
  taskLabel,
  onTaskLabelChange,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: PomodoroTimerProps) {
  const { t } = useTranslation();
  const radius = 120;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  const isIdle = timerState === "idle";

  // Session dots
  const dotsCount = sessionsBeforeLong;
  const completedDots = sessionCount % sessionsBeforeLong;

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col items-center px-6 py-8">
        {/* Circular progress ring */}
        <div className="relative mb-6">
          <svg
            width={radius * 2}
            height={radius * 2}
            className="-rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-muted/30"
            />
            {/* Progress circle */}
            {!isIdle && (
              <circle
                cx={radius}
                cy={radius}
                r={normalizedRadius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={cn(
                  "transition-all duration-1000 ease-linear",
                  getStrokeColor(timerState)
                )}
              />
            )}
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-semibold tabular-nums tracking-tight">
              {isIdle ? formatTime(0) : formatTime(secondsLeft)}
            </span>
            <span
              className={cn(
                "mt-1 text-sm font-medium",
                getStateColor(timerState)
              )}
            >
              {getStateLabel(timerState, t)}
            </span>
          </div>
        </div>

        {/* Session dots */}
        {!isIdle && (
          <div className="mb-4 flex items-center gap-1.5">
            {Array.from({ length: dotsCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  i < completedDots
                    ? "bg-primary"
                    : "bg-muted-foreground/20"
                )}
              />
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              {completedDots}/{dotsCount}
            </span>
          </div>
        )}

        {/* Task label input */}
        <div className="mb-6 w-full max-w-xs">
          <Input
            placeholder={t("pomodoro.taskPlaceholder")}
            value={taskLabel}
            onChange={(e) => onTaskLabelChange(e.target.value)}
            className="text-center"
            disabled={isRunning}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {isIdle ? (
            <Button size="lg" onClick={onStart}>
              <Play className="mr-2 size-4" />
              {t("pomodoro.start")}
            </Button>
          ) : (
            <>
              {isRunning ? (
                <Button size="lg" onClick={onPause}>
                  <Pause className="mr-2 size-4" />
                  {t("pomodoro.pause")}
                </Button>
              ) : (
                <Button size="lg" onClick={onResume}>
                  <Play className="mr-2 size-4" />
                  {t("pomodoro.resume")}
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={onSkip}>
                <SkipForward className="mr-2 size-4" />
                {t("pomodoro.skip")}
              </Button>
              <Button size="lg" variant="outline" onClick={onReset}>
                <RotateCcw className="mr-2 size-4" />
                {t("pomodoro.reset")}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
