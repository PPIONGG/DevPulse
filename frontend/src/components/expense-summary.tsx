"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCategoryConfig,
  formatAmount,
  expenseCategories,
} from "@/config/expense-categories";
import type { Expense } from "@/lib/types/database";

interface ExpenseSummaryProps {
  expenses: Expense[];
  currency: string;
}

export function ExpenseSummary({ expenses, currency }: ExpenseSummaryProps) {
  const summary = useMemo(() => {
    // Filter to selected currency
    const filtered = expenses.filter((e) => e.currency === currency);
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory = new Map<string, number>();
    for (const e of filtered) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    }

    // Sort by amount descending
    const categories = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
        config: getCategoryConfig(cat),
      }));

    return { total, categories, count: filtered.length };
  }, [expenses, currency]);

  if (summary.count === 0) {
    return null;
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Summary</CardTitle>
          <span className="text-lg font-bold">
            {formatAmount(summary.total, currency)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {summary.count} expense{summary.count !== 1 ? "s" : ""} in {currency}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-2">
          {summary.categories.map(({ category, amount, percent, config }) => (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
                <span className="font-medium">
                  {formatAmount(amount, currency)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(percent, 1)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthOption {
  value: string;
  label: string;
}

export function getMonthOptions(expenses: Expense[]): MonthOption[] {
  const months = new Set<string>();
  for (const e of expenses) {
    months.add(e.date.slice(0, 7)); // YYYY-MM
  }
  const sorted = [...months].sort().reverse();
  return sorted.map((m) => {
    const [year, month] = m.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      value: m,
      label: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  });
}
