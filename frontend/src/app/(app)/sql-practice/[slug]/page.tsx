"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChallengeEditor } from "@/components/challenge-editor";
import { ChallengeResult } from "@/components/challenge-result";
import { Skeleton } from "@/components/ui/skeleton";
import { useSqlChallenge } from "@/hooks/use-sql-practice";
import { getDifficultyConfig, getCategoryConfig, getStatusConfig } from "@/config/sql-practice";

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const {
    challenge,
    submissions,
    progress,
    loading,
    error,
    submitting,
    result,
    submit,
    refetch,
  } = useSqlChallenge(slug);

  const [query, setQuery] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = () => {
    submit(query);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/sql-practice")}>
          <ArrowLeft className="mr-2 size-4" /> Back to challenges
        </Button>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error || "Challenge not found"}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const difficulty = getDifficultyConfig(challenge.difficulty);
  const category = getCategoryConfig(challenge.category);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/sql-practice")}
          >
            <ArrowLeft className="mr-1 size-4" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">
                #{challenge.sort_order} {challenge.title}
              </h2>
              {progress?.is_solved && (
                <CheckCircle2 className="size-5 text-green-500" />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] ${difficulty.textColor}`}
              >
                {difficulty.label}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {category.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => {
              const prevOrder = challenge.sort_order - 1;
              if (prevOrder < 1) return;
              // Navigate programmatically — we'll just go back for now
              router.push("/sql-practice");
            }}
            disabled={challenge.sort_order <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => router.push("/sql-practice")}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left panel: Problem description */}
        <div className="space-y-4">
          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm">Problem</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {challenge.description}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 overflow-hidden">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm">Schema</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="overflow-x-auto bg-muted/50 p-4 text-xs font-mono leading-relaxed">
                {challenge.table_schema}
              </pre>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 overflow-hidden">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm">Sample Data</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="overflow-x-auto bg-muted/50 p-4 text-xs font-mono leading-relaxed">
                {challenge.seed_data}
              </pre>
            </CardContent>
          </Card>

          {challenge.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Lightbulb className="size-4" />
              <span>{showHint ? "Hide Hint" : "Show Hint"}</span>
              {showHint ? (
                <ChevronUp className="ml-auto size-4" />
              ) : (
                <ChevronDown className="ml-auto size-4" />
              )}
            </button>
          )}
          {showHint && challenge.hint && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm dark:border-yellow-900 dark:bg-yellow-950">
              {challenge.hint}
            </div>
          )}
        </div>

        {/* Right panel: Editor + Results */}
        <div className="space-y-4">
          <ChallengeEditor
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            submitting={submitting}
          />

          {result && <ChallengeResult result={result} />}

          {/* Submission history */}
          {submissions.length > 0 && (
            <Card className="gap-0 py-0">
              <CardHeader className="px-4 py-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex w-full items-center justify-between text-sm"
                >
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Submission History ({submissions.length})
                  </CardTitle>
                  {showHistory ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              {showHistory && (
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto">
                    {submissions.map((sub) => {
                      const statusConfig = getStatusConfig(sub.status);
                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between border-t px-4 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className="truncate text-muted-foreground font-mono">
                              {sub.query.slice(0, 60)}{sub.query.length > 60 ? "..." : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                            {sub.execution_time_ms != null && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="size-3" />
                                {sub.execution_time_ms}ms
                              </span>
                            )}
                            <span>
                              {new Date(sub.submitted_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
