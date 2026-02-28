"use client";

import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Play, ArrowRight, Star, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSqlAcademy } from "@/hooks/use-sql-practice";
import { useTranslation } from "@/providers/language-provider";

export default function SqlAcademyPage() {
  const router = useRouter();
  const { modules, loading, error } = useSqlAcademy();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="size-16 rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid gap-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GraduationCap className="mb-4 size-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium text-destructive">{t("sqlAcademy.loadFailed")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="size-10" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("sqlAcademy.title")}</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            {t("sqlAcademy.subtitle")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/sql-practice")}>
            {t("sqlAcademy.viewChallenges")}
          </Button>
          {modules.length > 0 && modules[0].lessons.length > 0 && (
            <Button onClick={() => router.push(`/sql-practice/learn/${modules[0].lessons[0].id}`)}>
              {t("sqlAcademy.startLearning")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {modules.map((module, moduleIdx) => (
          <div key={module.id} className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-mono">
                {moduleIdx + 1}
              </span>
              {module.title}
            </h3>
            <div className="grid gap-3">
              {module.lessons.map((lesson) => (
                <Card key={lesson.id} className="group hover:border-primary/50 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors relative">
                          <BookOpen className="size-4" />
                          {lesson.is_completed && (
                            <div className="absolute -right-1 -top-1 size-3 rounded-full bg-green-500 border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold group-hover:text-primary transition-colors">
                              {lesson.title}
                            </h4>
                            {lesson.is_completed && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none h-4 px-1 text-[9px] font-bold uppercase tracking-wider">
                                {t("sqlAcademy.completed")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {lesson.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-1.5">
                          <Badge variant="secondary" className="h-5 text-[10px] font-normal uppercase">
                            {t("sqlAcademy.duration")}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant={lesson.is_completed ? "outline" : "ghost"}
                          className="size-8 p-0"
                          onClick={() => router.push(`/sql-practice/learn/${lesson.id}`)}
                        >
                          {lesson.is_completed ? <CheckCircle2 className="size-4 text-green-500" /> : <Play className="size-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-bold">{t("sqlAcademy.cheatSheetTitle")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("sqlAcademy.cheatSheetDesc")}
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => router.push("/sql-practice/cheat-sheet")}>
            {t("sqlAcademy.openCheatSheet")}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
