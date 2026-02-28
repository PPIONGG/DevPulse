"use client";

import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Play, ArrowRight, Star, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sqlModules } from "@/config/sql-lessons";

export default function SqlAcademyPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="size-10" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SQL Academy</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Master the language of data. From your first query to complex joins, we'll guide you through every step with interactive lessons.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/sql-practice")}>
            View Challenges
          </Button>
          <Button onClick={() => router.push(`/sql-practice/learn/${sqlModules[0].lessons[0].id}`)}>
            Start Learning
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {sqlModules.map((module, moduleIdx) => (
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
                        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <BookOpen className="size-4" />
                        </div>
                        <div>
                          <h4 className="font-bold group-hover:text-primary transition-colors">
                            {lesson.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {lesson.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-1.5">
                          <Badge variant="secondary" className="h-5 text-[10px] font-normal uppercase">
                            5-10 min
                          </Badge>
                          <div className="flex">
                            <Star className="size-3 text-yellow-500 fill-yellow-500" />
                            <Star className="size-3 text-muted" />
                            <Star className="size-3 text-muted" />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-8 p-0"
                          onClick={() => router.push(`/sql-practice/learn/${lesson.id}`)}
                        >
                          <Play className="size-4" />
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
            <h4 className="font-bold">Need a quick reference?</h4>
            <p className="text-sm text-muted-foreground">
              Check out our SQL Cheat Sheet for syntax and common commands.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => router.push("/sql-practice/cheat-sheet")}>
            Open Cheat Sheet
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
