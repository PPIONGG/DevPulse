"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
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
  Code2,
  RotateCcw,
  BarChart2,
  Zap,
  PartyPopper,
  Trophy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChallengeEditor } from "@/components/challenge-editor";
import { ChallengeResult } from "@/components/challenge-result";
import { VisualSchema } from "@/components/sql-visual-schema";
import { CodeBlock } from "@/components/code-block";
import { Skeleton } from "@/components/ui/skeleton";
import { useSqlChallenge } from "@/hooks/use-sql-practice";
import { useTranslation } from "@/providers/language-provider";
import { getDifficultyConfig, getCategoryConfig, getStatusConfig } from "@/config/sql-practice";
import type { SqlTopSolution } from "@/lib/types/database";

const DRAFT_KEY = (slug: string) => `sql-draft-${slug}`;

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const {
    challenge,
    submissions,
    progress,
    prevSlug,
    nextSlug,
    solutionSql,
    loading,
    error,
    submitting,
    running,
    result,
    resultIsPreview,
    submit,
    run,
    previewTable,
    explain,
    getTopSolutions,
    refetch,
  } = useSqlChallenge(slug);

  const [query, setQuery] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [explainPlan, setExplainPlan] = useState<string | null>(null);
  const [topSolutions, setTopSolutions] = useState<SqlTopSolution[]>([]);
  const [explaining, setExplaining] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!initializedRef.current) {
      const saved = localStorage.getItem(DRAFT_KEY(slug));
      if (saved) setQuery(saved);
      initializedRef.current = true;
    }
  }, [slug]);

  // Save draft to localStorage (debounced)
  useEffect(() => {
    if (!initializedRef.current) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      if (query.trim()) {
        localStorage.setItem(DRAFT_KEY(slug), query);
      } else {
        localStorage.removeItem(DRAFT_KEY(slug));
      }
    }, 500);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [query, slug]);

  useEffect(() => {
    if (challenge?.id) {
      getTopSolutions().then(setTopSolutions);
    }
  }, [challenge?.id, getTopSolutions]);

  const handleSubmit = useCallback(async () => {
    const res = await submit(query);
    if (res?.status === "correct") {
      localStorage.removeItem(DRAFT_KEY(slug));
      setShowSuccess(true);
      getTopSolutions().then(setTopSolutions);
    }
  }, [query, submit, slug, getTopSolutions]);

  const handleExplain = useCallback(async () => {
    try {
      setExplaining(true);
      const plan = await explain(query);
      if (plan) setExplainPlan(plan);
    } catch (err) {
      // toast handled in hook
    } finally {
      setExplaining(false);
    }
  }, [query, explain]);

  const handleRun = useCallback(() => {
    run(query);
  }, [query, run]);

  const handleReset = useCallback(() => {
    setQuery("");
    localStorage.removeItem(DRAFT_KEY(slug));
  }, [slug]);

  const handleLoadQuery = useCallback((q: string) => {
    setQuery(q);
    toast.success(t("sqlPractice.queryLoaded"));
  }, [t]);

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
          <ArrowLeft className="mr-2 size-4" /> {t("sqlPractice.backToList")}
        </Button>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error || t("sqlPractice.notFound")}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            {t("common.tryAgain")}
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
            <ArrowLeft className="mr-1 size-4" /> {t("common.back")}
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
                {t(`sqlPractice.${challenge.difficulty}`)}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {t(`sqlPractice.cat${challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}`)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => router.push(`/sql-practice/${prevSlug}`)}
            disabled={!prevSlug}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => router.push(`/sql-practice/${nextSlug}`)}
            disabled={!nextSlug}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left panel: Problem description, Schema, and Sample Data */}
        <div className="space-y-4">
          <Tabs defaultValue="problem" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="problem">{t("sqlPractice.tabProblem")}</TabsTrigger>
              <TabsTrigger value="schema">{t("sqlPractice.tabSchema")}</TabsTrigger>
              <TabsTrigger value="data">{t("sqlPractice.tabSampleData")}</TabsTrigger>
            </TabsList>

            <TabsContent value="problem" className="mt-4 space-y-4">
              <Card className="gap-0 py-0">
                <CardContent className="px-4 py-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {challenge.description}
                  </p>
                </CardContent>
              </Card>

              {challenge.hint && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex w-full items-center gap-2 rounded-lg border px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Lightbulb className="size-3.5" />
                    <span>{showHint ? t("sqlPractice.hideHint") : t("sqlPractice.showHint")}</span>
                    {showHint ? (
                      <ChevronUp className="ml-auto size-3.5" />
                    ) : (
                      <ChevronDown className="ml-auto size-3.5" />
                    )}
                  </button>
                  {showHint && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 px-4 py-3 text-xs dark:border-yellow-900/30 dark:bg-yellow-950/20">
                      {challenge.hint}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="schema" className="mt-4">
              <VisualSchema
                metadata={challenge.metadata}
                onPreview={previewTable}
              />
              <div className="mt-4">
                <button
                  onClick={() => {
                    const el = document.getElementById("raw-schema");
                    if (el) el.classList.toggle("hidden");
                  }}
                  className="mb-2 text-[10px] text-muted-foreground hover:underline"
                >
                  {t("sqlPractice.showRawSchema")}
                </button>
                <div id="raw-schema" className="hidden">
                  <CodeBlock code={challenge.table_schema} language="sql" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              <Card className="gap-0 py-0 overflow-hidden">
                <CardContent className="p-0">
                  <CodeBlock code={challenge.seed_data} language="sql" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Solution reveal (only after solving) */}
          {solutionSql && (
            <div className="space-y-2">
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30 transition-colors"
              >
                <Code2 className="size-4" />
                <span>{showSolution ? t("sqlPractice.hideSolution") : t("sqlPractice.viewSolution")}</span>
                {showSolution ? (
                  <ChevronUp className="ml-auto size-4" />
                ) : (
                  <ChevronDown className="ml-auto size-4" />
                )}
              </button>
              {showSolution && (
                <Card className="gap-0 py-0 overflow-hidden border-green-200 dark:border-green-900">
                  <CardContent className="p-0">
                    <CodeBlock code={solutionSql} language="sql" />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right panel: Editor + Results */}
        <div className="space-y-4">
          <ChallengeEditor
            value={query}
            onChange={setQuery}
            onRun={handleRun}
            onSubmit={handleSubmit}
            onReset={handleReset}
            running={running}
            submitting={submitting}
            metadata={challenge.metadata}
          />

          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="results" className="text-[10px]">{t("sqlPractice.tabResults")}</TabsTrigger>
              <TabsTrigger value="plan" className="text-[10px]" onClick={handleExplain}>
                {t("sqlPractice.tabQueryPlan")}
              </TabsTrigger>
              <TabsTrigger value="best" className="text-[10px]">{t("sqlPractice.tabTopSolutions")}</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="mt-4">
              {showSuccess && result?.status === "correct" && (
                <div className="mb-4 flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/30 dark:bg-green-950/20">
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40">
                    <PartyPopper className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-green-900 dark:text-green-100">{t("sqlPractice.challengeSolved")}</h3>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    {t("sqlPractice.challengeSolvedDesc")}
                  </p>
                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSuccess(false)}
                    >
                      {t("sqlPractice.keepEditing")}
                    </Button>
                    {nextSlug && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/sql-practice/${nextSlug}`)}
                        className="gap-2"
                      >
                        {t("sqlPractice.nextChallenge")}
                        <ChevronRight className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {result && <ChallengeResult result={result} isPreview={resultIsPreview} />}
            </TabsContent>

            <TabsContent value="plan" className="mt-4">
              <Card className="overflow-hidden">
                <CardHeader className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium">
                      <BarChart2 className="size-3.5 text-primary" />
                      {t("sqlPractice.queryPlanTitle")}
                    </CardTitle>
                    {explaining && <Loader2 className="size-3 animate-spin" />}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {explainPlan ? (
                    <div className="max-h-[400px] overflow-auto bg-muted/30 p-4">
                      <pre className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                        {explainPlan}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <BarChart2 className="mb-2 size-8 opacity-20" />
                      <p className="text-xs">{t("sqlPractice.queryPlanPlaceholder")}</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleExplain}
                        className="mt-1 h-auto p-0 text-xs"
                        disabled={explaining || !query.trim()}
                      >
                        {t("sqlPractice.analyzeQuery")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="best" className="mt-4">
              <Card>
                <CardHeader className="px-4 py-3">
                  <CardTitle className="flex items-center gap-2 text-xs font-medium">
                    <Trophy className="size-3.5 text-yellow-500" />
                    {t("sqlPractice.topSolutions")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {topSolutions.length > 0 ? (
                      topSolutions.map((sol, i) => (
                        <div key={sol.id} className="flex items-center justify-between px-4 py-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-4 font-mono font-bold text-muted-foreground">
                              {i + 1}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {sol.display_name || t("sqlPractice.anonymousUser")}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(sol.submitted_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <span className="flex items-center gap-1 font-mono font-medium text-primary">
                                <Zap className="size-3" />
                                {sol.execution_time_ms}ms
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {sol.query_length} {t("sqlPractice.chars")}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => {
                                setQuery(sol.query);
                                toast.success(t("sqlPractice.solutionLoaded"));
                              }}
                            >
                              <RotateCcw className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        {t("sqlPractice.noSolutions")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          {submissions.length > 0 && (
            <Card className="gap-0 py-0">
              <CardHeader className="px-4 py-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex w-full items-center justify-between text-sm"
                >
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {t("sqlPractice.submissionHistory")} ({submissions.length})
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
                            <button
                              onClick={() => handleLoadQuery(sub.query)}
                              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-muted transition-colors"
                              title={t("sqlPractice.loadQueryTitle")}
                            >
                              <RotateCcw className="size-3" />
                            </button>
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
