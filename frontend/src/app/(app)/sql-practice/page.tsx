"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeCardSkeleton } from "@/components/skeletons";
import { useSqlPractice } from "@/hooks/use-sql-practice";
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

  const progressPercent = useMemo(() => {
    if (!stats || stats.total_challenges === 0) return 0;
    return Math.round((stats.solved / stats.total_challenges) * 100);
  }, [stats]);

  const handleCardClick = (slug: string) => {
    router.push(`/sql-practice/${slug}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SQL Practice</h2>
        <p className="mt-1 text-muted-foreground">
          Practice SQL queries with interactive challenges.
        </p>
      </div>

      {stats && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {stats.solved} / {stats.total_challenges} solved
            </span>
            <span className="text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              Easy: {stats.easy_solved}/{stats.easy_total}
            </span>
            <span>
              Medium: {stats.medium_solved}/{stats.medium_total}
            </span>
            <span>
              Hard: {stats.hard_solved}/{stats.hard_total}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search challenges..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {challengeDifficulties.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {challengeCategories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="unsolved">Unsolved</SelectItem>
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
            Try again
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
          <h3 className="text-lg font-medium">No challenges found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.trim() || difficultyFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "No challenges are available yet."}
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
