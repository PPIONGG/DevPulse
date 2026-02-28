"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/providers/language-provider";
import type { TimeReport as TimeReportType } from "@/lib/types/database";

interface TimeReportProps {
  report: TimeReportType | null;
}

const FALLBACK_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f97316", "#a855f7",
  "#14b8a6", "#ec4899", "#eab308", "#6366f1", "#6b7280",
];

function formatHours(h: number): string {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function TimeReport({ report }: TimeReportProps) {
  const { t } = useTranslation();

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">{t("timeTracker.noReportData")}</p>
      </div>
    );
  }

  const barData = report.by_day.map((d) => ({
    date: d.date.slice(5), // MM-DD
    hours: Math.round(d.hours * 100) / 100,
  }));

  const pieData = report.by_project.map((p, i) => ({
    name: p.project_name,
    value: Math.round(p.hours * 100) / 100,
    color: p.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("timeTracker.totalHours")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold">{formatHours(report.total_hours)}</p>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("timeTracker.billableHours")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold">{formatHours(report.billable_hours)}</p>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("timeTracker.totalAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold">
              ${report.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium">{t("timeTracker.hoursByDay")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {barData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("timeTracker.noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value) => [`${value}h`, t("timeTracker.hours")]}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium">{t("timeTracker.hoursByProject")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {pieData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("timeTracker.noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value) => [`${value}h`, t("timeTracker.hours")]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
