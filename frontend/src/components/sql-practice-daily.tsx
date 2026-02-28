"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/providers/language-provider";
import type { SqlChallenge } from "@/lib/types/database";
import { getDifficultyConfig } from "@/config/sql-practice";

interface SqlPracticeDailyProps {
  challenge?: SqlChallenge;
}

export function SqlPracticeDaily({ challenge }: SqlPracticeDailyProps) {
  const router = useRouter();
  const { t } = useTranslation();

  if (!challenge) return null;

  const difficulty = getDifficultyConfig(challenge.difficulty);

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
      <div className="absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-full bg-primary/10 blur-3xl" />
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("sqlPractice.dailyChallenge")}
              </span>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {t("sqlPractice.bonusXP")}
              </Badge>
            </div>
            <h3 className="mt-0.5 text-lg font-bold">{challenge.title}</h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className={`h-4 text-[10px] ${difficulty.textColor}`}
              >
                {difficulty.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t("sqlPractice.categoryLabel")} {challenge.category}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-muted-foreground">{t("sqlPractice.streakLabel")}</p>
            <div className="flex items-center gap-1 text-sm font-bold">
              <Sparkles className="size-3 text-orange-500" />
              <span>{t("sqlPractice.keepItUp")}</span>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/sql-practice/${challenge.slug}`)}
            className="group gap-2"
          >
            {t("sqlPractice.solveNow")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
