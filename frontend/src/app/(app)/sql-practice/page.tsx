"use client";

import { useRouter } from "next/navigation";
import { Search, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChallengeCard } from "@/components/challenge-card";
import { SqlPracticeStats } from "@/components/sql-practice-stats";
import { SqlPracticeDaily } from "@/components/sql-practice-daily";
import { ChallengeCardSkeleton } from "@/components/skeletons";
import { useSqlPractice } from "@/hooks/use-sql-practice";
import { useTranslation } from "@/providers/language-provider";
import { challengeDifficulties, challengeCategories } from "@/config/sql-practice";

export default function SqlPracticePage() {
  const router = useRouter();
  const {
    challenges,
    stats,
    loading,
    error,
    difficultyFilter,
    setDifficultyFilter,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    refetch,
  } = useSqlPractice();
  const { t } = useTranslation();

  const handleCardClick = (slug: string) => {
    router.push(`/sql-practice/${slug}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sqlPractice.title")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("sqlPractice.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/sql-practice/cheat-sheet")}>
            {t("sqlPractice.cheatSheet")}
          </Button>
          <Button size="sm" onClick={() => router.push("/sql-practice/learn")} className="gap-2">
            <GraduationCap className="size-4" />
            {t("sqlPractice.academy")}
          </Button>
        </div>
      </div>

      <SqlPracticeStats stats={stats} />

      <SqlPracticeDaily challenge={stats?.daily_challenge} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("sqlPractice.searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t("sqlPractice.difficulty")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("sqlPractice.allLevels")}</SelectItem>
            {challengeDifficulties.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={t("sqlPractice.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("sqlPractice.allCategories")}</SelectItem>
            {challengeCategories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t("sqlPractice.statusLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("sqlPractice.allStatus")}</SelectItem>
            <SelectItem value="solved">{t("sqlPractice.solved")}</SelectItem>
            <SelectItem value="unsolved">{t("sqlPractice.unsolved")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <ChallengeCardSkeleton key={i} />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GraduationCap className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">{t("sqlPractice.noMatch")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.trim() || difficultyFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all"
              ? t("sqlPractice.noMatchDesc")
              : t("sqlPractice.empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge, i) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              index={challenge.sort_order - 1}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
