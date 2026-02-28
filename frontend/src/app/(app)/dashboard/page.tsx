"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Code2,
  DollarSign,
  Target,
  Kanban,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardSkeleton } from "@/components/skeletons";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { stats, recentSnippets, loading, error, refetch } =
    useDashboard();

  const toastShown = useRef(false);
  useEffect(() => {
    if (toastShown.current) return;
    const t = searchParams.get("toast");
    if (t === "login") { toast.success("Signed in successfully!"); toastShown.current = true; }
    if (t === "register") { toast.success("Account created successfully!"); toastShown.current = true; }
    if (t) {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, [searchParams]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !stats.snippets) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-muted-foreground">
            Welcome to DevPulse. Your developer productivity hub.
          </p>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-muted-foreground">
          Welcome to DevPulse. Your developer productivity hub.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
            Try again
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/code-snippets/my-snippets" className="group block">
          <Card className="gap-0 py-0 transition-colors group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="flex-row items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">
                Code Snippets
              </p>
              <Code2 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-2xl font-bold">{stats.snippets}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/expenses" className="group block">
          <Card className="gap-0 py-0 transition-colors group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="flex-row items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">
                Expenses
              </p>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-2xl font-bold">{stats.expenses}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/habits" className="group block">
          <Card className="gap-0 py-0 transition-colors group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="flex-row items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">
                Active Habits
              </p>
              <Target className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-2xl font-bold">{stats.habits}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/kanban" className="group block">
          <Card className="gap-0 py-0 transition-colors group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="flex-row items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">
                Kanban Boards
              </p>
              <Kanban className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-2xl font-bold">{stats.boards}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between px-4 py-3">
          <CardTitle className="text-base">Recent Snippets</CardTitle>
          <Link
            href="/code-snippets/my-snippets"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {recentSnippets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No snippets yet.</p>
          ) : (
            <div className="space-y-1">
              {recentSnippets.map((s) => (
                <Link
                  key={s.id}
                  href="/code-snippets/my-snippets"
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {s.language}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
