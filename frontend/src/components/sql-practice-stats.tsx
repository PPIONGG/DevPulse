"use client";

import { Trophy, Zap, Target, Flame, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCategoryConfig } from "@/config/sql-practice";
import type { SqlPracticeStats as SqlPracticeStatsType } from "@/lib/types/database";

interface SqlPracticeStatsProps {
  stats: SqlPracticeStatsType | null;
}

export function SqlPracticeStats({ stats }: SqlPracticeStatsProps) {
  if (!stats) return null;

  const totalPercent = stats.total_challenges > 0
    ? Math.round((stats.solved / stats.total_challenges) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Total Progress"
          value={stats.solved}
          subtitle={`/ ${stats.total_challenges} solved`}
          percent={totalPercent}
          icon={<Trophy className="size-4 text-muted-foreground" />}
        />
        <StatCard
          title="Easy"
          value={stats.easy_solved}
          subtitle={`/ ${stats.easy_total}`}
          percent={stats.easy_total > 0 ? Math.round((stats.easy_solved / stats.easy_total) * 100) : 0}
          icon={<Zap className="size-4 text-green-500" />}
          barColor="bg-green-500"
        />
        <StatCard
          title="Medium"
          value={stats.medium_solved}
          subtitle={`/ ${stats.medium_total}`}
          percent={stats.medium_total > 0 ? Math.round((stats.medium_solved / stats.medium_total) * 100) : 0}
          icon={<Target className="size-4 text-yellow-500" />}
          barColor="bg-yellow-500"
        />
        <StatCard
          title="Hard"
          value={stats.hard_solved}
          subtitle={`/ ${stats.hard_total}`}
          percent={stats.hard_total > 0 ? Math.round((stats.hard_solved / stats.hard_total) * 100) : 0}
          icon={<Flame className="size-4 text-red-500" />}
          barColor="bg-red-500"
        />
      </div>

      {stats.categories?.length > 0 && (
        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="size-3" /> {stats.practice_streak} day streak
              </span>
              <span className="flex items-center gap-1">
                <Send className="size-3" /> {stats.total_submissions} submissions
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-2.5">
              {stats.categories.map((cat) => {
                const config = getCategoryConfig(cat.category);
                const pct = cat.total > 0 ? Math.round((cat.solved / cat.total) * 100) : 0;
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-muted-foreground">
                        {cat.solved}/{cat.total}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  percent,
  icon,
  barColor,
}: {
  title: string;
  value: number;
  subtitle: string;
  percent: number;
  icon: React.ReactNode;
  barColor?: string;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between px-4 py-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${barColor ?? "bg-primary"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
