"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Code2,
  DollarSign,
  Target,
  Kanban,
  ArrowRight,
  Plus,
  Zap,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  LayoutGrid,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/providers/auth-provider";
import { useTranslation } from "@/providers/language-provider";
import { DashboardSkeleton } from "@/components/skeletons";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const { stats, recentSnippets, upcomingTasks, todayHabits, dailyChallenge, loading, error, refetch } =
    useDashboard();
  const { t } = useTranslation();

  const toastShown = useRef(false);
  useEffect(() => {
    if (toastShown.current) return;
    const toastType = searchParams.get("toast");
    if (toastType === "login") { toast.success(t("auth.signedIn")); toastShown.current = true; }
    if (toastType === "register") { toast.success(t("auth.accountCreated")); toastShown.current = true; }
    if (toastType) {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, [searchParams, t]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const habitProgress = stats.habitsToday > 0 
    ? Math.round((stats.habitsCompleted / stats.habitsToday) * 100) 
    : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("dashboard.welcome")} {profile?.display_name || user?.email?.split('@')[0] || t("dashboard.developer")}
          </h2>
          <p className="text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/code-snippets')} size="sm" className="gap-2">
            <Plus className="size-4" />
            {t("dashboard.newSnippet")}
          </Button>
          <Button onClick={() => router.push('/kanban')} variant="outline" size="sm" className="gap-2">
            <LayoutGrid className="size-4" />
            {t("dashboard.boards")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <p>{error}</p>
          <Button variant="ghost" size="sm" onClick={refetch} className="h-8 hover:bg-destructive/10">
            {t("dashboard.retry")}
          </Button>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        
        {/* SQL Daily Challenge - Large Card */}
        <Card className="md:col-span-2 lg:row-span-1 overflow-hidden group border-primary/20 bg-primary/5">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 size-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-background/50 border-primary/30 text-primary">{t("dashboard.dailySql")}</Badge>
              <Zap className="size-4 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-xl mt-2">{dailyChallenge?.title || t("dashboard.dailyChallenge")}</CardTitle>
            <CardDescription className="line-clamp-1">{dailyChallenge?.description || t("dashboard.dailyChallengeDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push(`/sql-practice/${dailyChallenge?.slug || ''}`)}
              className="w-full mt-2 group/btn"
            >
              {t("dashboard.solveChallenge")}
              <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Habit Progress */}
        <Card className="lg:row-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              {t("dashboard.habitsToday")}
              <Target className="size-4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{stats.habitsCompleted}/{stats.habitsToday}</span>
              <span className="text-sm font-medium text-muted-foreground">{habitProgress}%</span>
            </div>
            <Progress value={habitProgress} className="h-2" />
            <div className="space-y-1.5 pt-1">
              {todayHabits.slice(0, 2).map(h => (
                <div key={h.id} className="flex items-center gap-2 text-xs">
                  <Circle className="size-3 text-muted-foreground" />
                  <span className="truncate">{h.title}</span>
                </div>
              ))}
              {stats.habitsToday > 2 && (
                <p className="text-[10px] text-muted-foreground">+{stats.habitsToday - 2} {t("dashboard.more")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Summary */}
        <Card className="lg:row-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              {t("dashboard.monthlySpend")}
              <TrendingUp className="size-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-3xl font-bold">฿{stats.monthlyExpenses.toLocaleString()}</span>
              <p className="text-xs text-muted-foreground mt-1">{t("dashboard.totalForMonth")} {new Date().toLocaleString('default', { month: 'long' })}</p>
            </div>
            <Button variant="link" onClick={() => router.push('/expenses')} className="h-auto p-0 mt-4 text-xs">
              {t("dashboard.manageExpenses")}
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Tasks - Wide or Multi-row */}
        <Card className="md:col-span-2 lg:col-span-2 lg:row-span-1">
          <CardHeader className="flex-row items-center justify-between py-4">
            <div className="space-y-0.5">
              <CardTitle className="text-base">{t("dashboard.upcomingTasks")}</CardTitle>
              <CardDescription>{t("dashboard.fromKanban")}</CardDescription>
            </div>
            <Link href="/kanban" className="text-xs text-primary hover:underline">{t("common.viewAll")}</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t">
              {upcomingTasks.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">{t("dashboard.noDeadlines")}</p>
              ) : (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 px-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`size-2 shrink-0 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <span className="truncate text-sm font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Calendar className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{task.due_date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Snippets */}
        <Card className="md:col-span-2 lg:col-span-2 lg:row-span-1">
          <CardHeader className="flex-row items-center justify-between py-4">
            <div className="space-y-0.5">
              <CardTitle className="text-base">{t("dashboard.recentSnippets")}</CardTitle>
              <CardDescription>{t("dashboard.latestSnippets")}</CardDescription>
            </div>
            <Link href="/code-snippets/my-snippets" className="text-xs text-primary hover:underline">{t("common.manage")}</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-t">
              {recentSnippets.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center col-span-2">{t("dashboard.noSnippets")}</p>
              ) : (
                recentSnippets.slice(0, 4).map((s) => (
                  <Link
                    key={s.id}
                    href="/code-snippets/my-snippets"
                    className="flex flex-col gap-1 p-3 px-4 hover:bg-muted/50 transition-colors overflow-hidden"
                  >
                    <span className="truncate text-sm font-medium">{s.title}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase">{s.language}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(s.updated_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
