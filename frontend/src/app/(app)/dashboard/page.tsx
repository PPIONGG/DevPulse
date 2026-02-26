"use client";

import {
  Code2,
  ClipboardList,
  FileText,
  LinkIcon,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { getCategoryConfig } from "@/config/categories";

export default function DashboardPage() {
  const { stats, recentSnippets, recentWorkLogs, weeklyHours, loading } =
    useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    {
      label: "Code Snippets",
      value: stats.snippets,
      icon: Code2,
      href: "/code-snippets/my-snippets",
    },
    {
      label: "Work Logs",
      value: stats.workLogs,
      icon: ClipboardList,
      href: "/work-log",
    },
    {
      label: "Articles",
      value: stats.articles,
      icon: FileText,
      href: "/knowledge-base/articles",
    },
    {
      label: "Bookmarks",
      value: stats.bookmarks,
      icon: LinkIcon,
      href: "/knowledge-base/bookmarks",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-muted-foreground">
          Welcome to DevPulse. Your developer productivity hub.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="gap-0 py-0">
            <CardHeader className="flex-row items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center gap-2 px-4 py-3">
          <Clock className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Weekly Hours</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <p className="text-3xl font-bold">{weeklyHours}h</p>
          <p className="text-sm text-muted-foreground">logged this week</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base">Recent Snippets</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {recentSnippets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No snippets yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSnippets.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2"
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base">Recent Work Logs</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {recentWorkLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No work logs yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentWorkLogs.map((w) => {
                  const category = getCategoryConfig(w.category);
                  return (
                    <div
                      key={w.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {w.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {w.date}
                          {w.hours_spent !== null && ` — ${w.hours_spent}h`}
                        </p>
                      </div>
                      <Badge
                        className={`shrink-0 border-0 text-xs ${category.color}`}
                      >
                        {category.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
