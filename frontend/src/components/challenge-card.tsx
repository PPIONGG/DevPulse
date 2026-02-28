"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDifficultyConfig, getCategoryConfig } from "@/config/sql-practice";
import type { SqlChallengeWithProgress } from "@/lib/types/database";

interface ChallengeCardProps {
  challenge: SqlChallengeWithProgress;
  index: number;
  onClick: (slug: string) => void;
}

export function ChallengeCard({ challenge, index, onClick }: ChallengeCardProps) {
  const difficulty = getDifficultyConfig(challenge.difficulty);
  const category = getCategoryConfig(challenge.category);
  const isSolved = challenge.progress?.is_solved ?? false;

  return (
    <Card
      className="cursor-pointer gap-0 py-0 transition-colors hover:bg-muted/50"
      onClick={() => onClick(challenge.slug)}
    >
      <CardHeader className="flex-row items-center gap-3 px-4 py-3">
        <div className="flex shrink-0 items-center">
          {isSolved ? (
            <CheckCircle2 className="size-5 text-green-500" />
          ) : (
            <Circle className="size-5 text-muted-foreground/40" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-mono text-muted-foreground">
              #{index + 1}
            </span>
            <CardTitle className="truncate text-sm">{challenge.title}</CardTitle>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${difficulty.textColor}`}
            >
              {difficulty.label}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {category.label}
            </Badge>
            {isSolved && challenge.progress?.best_time_ms != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="size-2.5" />
                {challenge.progress.best_time_ms}ms
              </span>
            )}
            {challenge.progress && challenge.progress.attempts > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {challenge.progress.attempts} attempt{challenge.progress.attempts !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
