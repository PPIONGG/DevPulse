"use client";

import { Clock, Calendar, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PomodoroStatsSkeleton } from "@/components/skeletons";
import type { PomodoroStats as PomodoroStatsType } from "@/lib/types/database";

interface PomodoroStatsProps {
  stats: PomodoroStatsType | null;
  loading: boolean;
}

function formatMinutes(minutes: number): string {
  if (minutes < 1) return "0 min";
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(minutes)} min`;
}

export function PomodoroStats({ stats, loading }: PomodoroStatsProps) {
  if (loading) return <PomodoroStatsSkeleton />;

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between px-4 py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today
          </CardTitle>
          <Clock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="text-2xl font-bold">{stats.today_sessions}</div>
          <p className="text-xs text-muted-foreground">
            {stats.today_sessions === 1 ? "session" : "sessions"} &middot;{" "}
            {formatMinutes(stats.today_minutes)}
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between px-4 py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Week
          </CardTitle>
          <Calendar className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="text-2xl font-bold">{stats.week_sessions}</div>
          <p className="text-xs text-muted-foreground">
            {stats.week_sessions === 1 ? "session" : "sessions"} &middot;{" "}
            {formatMinutes(stats.week_minutes)}
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between px-4 py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Streak
          </CardTitle>
          <Flame className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="text-2xl font-bold">{stats.current_streak}</div>
          <p className="text-xs text-muted-foreground">
            {stats.current_streak === 1 ? "day" : "days"} &middot;{" "}
            {stats.total_sessions} total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
