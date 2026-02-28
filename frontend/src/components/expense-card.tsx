"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  CalendarDays,
  Repeat,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategoryConfig, formatAmount } from "@/config/expense-categories";
import type { Expense } from "@/lib/types/database";

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const category = getCategoryConfig(expense.category);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">
                {expense.title}
              </CardTitle>
              {expense.is_recurring && (
                <span title="Recurring">
                  <Repeat className="size-3.5 shrink-0 text-muted-foreground" />
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              {new Date(expense.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {expense.notes && (
                <>
                  <span className="text-border">|</span>
                  <span className="truncate">{expense.notes}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-base font-semibold">
            {formatAmount(expense.amount, expense.currency)}
          </span>
          <Badge className={`text-xs ${category.color}`} variant="secondary">
            {category.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(expense)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  );
}
