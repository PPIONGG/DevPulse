"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  Flame,
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
import { useTranslation } from "@/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n";
import type { HabitWithStats } from "@/lib/types/database";

interface HabitCardProps {
  habit: HabitWithStats;
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (habit: HabitWithStats) => void;
  onArchive: (habit: HabitWithStats) => void;
  onToggle: (habitId: string, date: string) => void;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return days;
}

const frequencyKeys: Record<string, TranslationKey> = {
  daily: "habits.daily",
  weekdays: "habits.weekdays",
  weekly: "habits.weekly",
};

export function HabitCard({
  habit,
  onEdit,
  onDelete,
  onArchive,
  onToggle,
}: HabitCardProps) {
  const { t } = useTranslation();
  const today = todayStr();
  const isCompletedToday = habit.completions.some(
    (c) => c.completed_date === today
  );
  const completionDates = new Set(habit.completions.map((c) => c.completed_date));
  const last30 = getLast30Days();

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-start justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            onClick={() => onToggle(habit.id, today)}
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
            style={{
              borderColor: habit.color,
              backgroundColor: isCompletedToday ? habit.color : "transparent",
            }}
          >
            {isCompletedToday && (
              <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">
                {habit.title}
              </CardTitle>
              <Badge variant="outline" className="shrink-0 text-xs">
                {frequencyKeys[habit.frequency] ? t(frequencyKeys[habit.frequency]) : habit.frequency}
              </Badge>
            </div>
            {habit.description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {habit.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="size-3" style={{ color: habit.color }} />
                {habit.currentStreak} {t("habits.dayStreak")}
              </span>
              <span>{habit.completionRate}% (30d)</span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(habit)}>
              <Pencil className="mr-2 size-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(habit)}>
              {habit.is_archived ? (
                <>
                  <ArchiveRestore className="mr-2 size-4" />
                  {t("habits.unarchive")}
                </>
              ) : (
                <>
                  <Archive className="mr-2 size-4" />
                  {t("habits.archive")}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(habit)}
            >
              <Trash2 className="mr-2 size-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {/* Mini calendar grid */}
      <div className="flex gap-[3px] px-4 pb-3">
        {last30.map((day) => {
          const completed = completionDates.has(day);
          return (
            <button
              key={day}
              onClick={() => onToggle(habit.id, day)}
              className={`size-3 rounded-sm transition-colors ${
                completed ? "" : "bg-muted"
              }`}
              style={completed ? { backgroundColor: habit.color } : undefined}
              title={day}
            />
          );
        })}
      </div>
    </Card>
  );
}
