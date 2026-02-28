"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChallengeEditor } from "@/components/challenge-editor";
import { ChallengeResult } from "@/components/challenge-result";
import { VisualSchema } from "@/components/sql-visual-schema";
import { useSqlChallenge } from "@/hooks/use-sql-practice";
import { sqlModules, type SqlLesson } from "@/config/sql-lessons";

export default function SqlLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Find current lesson and its neighbors
  const allLessons = sqlModules.flatMap(m => m.lessons);
  const lessonIdx = allLessons.findIndex(l => l.id === id);
  const lesson = allLessons[lessonIdx];
  const prevLesson = allLessons[lessonIdx - 1];
  const nextLesson = allLessons[lessonIdx + 1];

  // We use a dummy slug for the hook to use the execution engine
  // In a real app, you might have a dedicated "sandbox" endpoint for lessons
  // but here we can reuse the first challenge's environment for simplicity
  const {
    run,
    previewTable,
    result,
    running,
    resultIsPreview,
  } = useSqlChallenge("select-all-employees");

  const [query, setQuery] = useState(lesson?.practiceQuery || "");
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (lesson) setQuery(lesson.practiceQuery);
    setSolved(false);
  }, [lesson]);

  const handleRun = useCallback(async () => {
    const res = await run(query);
    if (res?.status === "correct") {
      setSolved(true);
    }
  }, [query, run]);

  if (!lesson) {
    return <div>Lesson not found</div>;
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
            <ArrowLeft className="mr-1 size-4" /> Academy
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <h2 className="text-lg font-bold">{lesson.title}</h2>
            {solved && <CheckCircle2 className="size-5 text-green-500" />}
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
            Prev
          </Button>
          <Button
            variant={solved ? "default" : "outline"}
            size="sm"
            onClick={() => router.push(`/sql-practice/learn/${nextLesson.id}`)}
            disabled={!nextLesson}
            className="h-8 gap-1"
          >
            Next
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
              <CardTitle className="text-sm">Database Schema</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <VisualSchema onPreview={previewTable} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Sandbox */}
        <div className="space-y-4">
          <ChallengeEditor
            value={query}
            onChange={setQuery}
            onRun={handleRun}
            onSubmit={handleRun} // In lessons, submit just runs it
            running={running}
            submitting={false}
          />

          {result && (
            <div className="space-y-3">
              {solved && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/30 dark:bg-green-950/20 text-green-800 dark:text-green-200 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Correct! You've completed this lesson.
                  {nextLesson && (
                    <Button 
                      variant="link" 
                      className="h-auto p-0 ml-auto text-green-700 dark:text-green-400 font-bold"
                      onClick={() => router.push(`/sql-practice/learn/${nextLesson.id}`)}
                    >
                      Next Lesson →
                    </Button>
                  )}
                </div>
              )}
              <ChallengeResult result={result} isPreview={resultIsPreview} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
