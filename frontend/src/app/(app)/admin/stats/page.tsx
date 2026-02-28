"use client";

import { useAuth } from "@/providers/auth-provider";
import { redirect } from "next/navigation";
import { useAdminStats } from "@/hooks/use-admin-stats";
import {
  BarChart3, Users, Code2, DollarSign, Target, Kanban,
  ShieldCheck, Database, Loader2, RefreshCcw, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statCards = [
  { key: "total_users", label: "Total Users", icon: Users },
  { key: "active_users", label: "Active Users", icon: Activity },
  { key: "total_snippets", label: "Snippets", icon: Code2 },
  { key: "total_expenses", label: "Expenses", icon: DollarSign },
  { key: "total_habits", label: "Habits", icon: Target },
  { key: "total_boards", label: "Kanban Boards", icon: Kanban },
  { key: "total_vaults", label: "Env Vaults", icon: ShieldCheck },
  { key: "total_challenges", label: "SQL Challenges", icon: Database },
  { key: "total_sessions", label: "Active Sessions", icon: BarChart3 },
] as const;

export default function SystemStatsPage() {
  const { user, loading: authLoading } = useAuth();
  const { stats, loading, refetch } = useAdminStats();

  if (!authLoading && user?.role !== "admin") {
    redirect("/dashboard");
  }

  if (authLoading || loading || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxUsage = Math.max(...stats.feature_usage.map(f => f.count), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Stats</h2>
          <p className="text-muted-foreground">Overview of platform usage and growth.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCcw className="size-3" /> Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-bold">
                {stats[key as keyof typeof stats] as number}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Growth (30 days)</CardTitle>
            <CardDescription>New user registrations per day</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.user_growth.length > 0 ? (
              <div className="flex items-end gap-1 h-32">
                {stats.user_growth.map((day) => {
                  const maxCount = Math.max(...stats.user_growth.map(d => d.count), 1);
                  const height = Math.max((day.count / maxCount) * 100, 4);
                  return (
                    <div
                      key={day.date}
                      className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${day.count} users`}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Usage</CardTitle>
            <CardDescription>Total items created per feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.feature_usage.map((feature) => (
                <div key={feature.feature}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{feature.feature}</span>
                    <span className="text-sm font-medium">{feature.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(feature.count / maxUsage) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {stats.feature_usage.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
