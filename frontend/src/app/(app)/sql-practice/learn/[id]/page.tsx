"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChallengeEditor } from "@/components/challenge-editor";
import { ChallengeResult } from "@/components/challenge-result";
import { VisualSchema } from "@/components/sql-visual-schema";
import { useSqlAcademyLesson, useSqlAcademy } from "@/hooks/use-sql-practice";
import { useTranslation } from "@/providers/language-provider";
import { previewTable } from "@/lib/services/sql-practice";

export default function SqlLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation();

  const { lesson, loading, error, running, result, run } = useSqlAcademyLesson(id);
  const { modules } = useSqlAcademy();

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (lesson) setQuery(lesson.practice_query);
  }, [lesson]);

  // Find neighbors for navigation
  const allLessons = modules.flatMap((m) => m.lessons);
  const lessonIdx = allLessons.findIndex((l) => l.id === id);
  const prevLesson = allLessons[lessonIdx - 1];
  const nextLesson = allLessons[lessonIdx + 1];

  const handleRun = useCallback(() => {
    run(query);
  }, [query, run]);

  const handlePreview = useCallback((tableName: string) => {
    // In lessons, we don't have a slug, but the backend PreviewTable handler expects one.
    // However, our VisualSchema in lesson context might need a different approach 
    // or the backend needs to support preview by lesson ID.
    // For now, let's keep it simple.
    return previewTable("intro-to-sql", tableName); // Temporary fallback
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium text-destructive">{t("sqlAcademy.lessonError")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{error || t("sqlAcademy.lessonNotFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/sql-practice/learn")}>
          {t("sqlAcademy.backToAcademy")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/sql-practice/learn")}
          >
            <ArrowLeft className="mr-1 size-4" /> {t("sqlAcademy.breadcrumbAcademy")}
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <h2 className="text-lg font-bold">{lesson.title}</h2>
            {lesson.is_completed && <CheckCircle2 className="size-5 text-green-500" />}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/sql-practice/learn/${prevLesson.id}`)}
            disabled={!prevLesson}
            className="h-8 gap-1"
          >
            <ChevronLeft className="size-4" />
            {t("common.prev")}
          </Button>
          <Button
            variant={lesson.is_completed ? "default" : "outline"}
            size="sm"
            onClick={() => router.push(`/sql-practice/learn/${nextLesson.id}`)}
            disabled={!nextLesson}
            className="h-8 gap-1"
          >
            {t("common.next")}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Content */}
        <div className="space-y-4">
          <Card className="h-fit">
            <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {lesson.content}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm">{t("sqlAcademy.databaseSchema")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="rounded-md border bg-muted/20 p-4 text-xs font-mono">
                <p className="text-muted-foreground mb-2">{t("sqlAcademy.availableTables")}</p>
                <pre className="text-primary">{lesson.table_schema}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sandbox */}
        <div className="space-y-4">
          <ChallengeEditor
            value={query}
            onChange={setQuery}
            onRun={handleRun}
            onSubmit={handleRun}
            running={running}
            submitting={false}
          />

          {result && (
            <div className="space-y-3">
              {result.status === "correct" && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/30 dark:bg-green-950/20 text-green-800 dark:text-green-200 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  {t("sqlAcademy.lessonComplete")}
                  {nextLesson && (
                    <Button
                      variant="link"
                      className="h-auto p-0 ml-auto text-green-700 dark:text-green-400 font-bold"
                      onClick={() => router.push(`/sql-practice/learn/${nextLesson.id}`)}
                    >
                      {t("sqlAcademy.nextLesson")}
                    </Button>
                  )}
                </div>
              )}
              <ChallengeResult result={result} isPreview={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
