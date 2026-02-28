"use client";

import { useState, useMemo } from "react";
import { Trash2, Clock, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useTranslation } from "@/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n";
import type { PomodoroSession } from "@/lib/types/database";

interface PomodoroHistoryProps {
  sessions: PomodoroSession[];
  onDelete: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

interface GroupedSessions {
  label: string;
  sessions: PomodoroSession[];
}

function formatDuration(seconds: number, t: (key: TranslationKey) => string): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return t("pomodoro.lessThanMin");
  return `${minutes} ${t("pomodoro.min")}`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDateLabel(dateStr: string, t: (key: TranslationKey) => string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = date.toDateString();
  if (dateOnly === today.toDateString()) return t("pomodoro.todayLabel");
  if (dateOnly === yesterday.toDateString()) return t("pomodoro.yesterdayLabel");

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function groupByDate(sessions: PomodoroSession[], t: (key: TranslationKey) => string): GroupedSessions[] {
  const groups = new Map<string, PomodoroSession[]>();

  for (const session of sessions) {
    const label = getDateLabel(session.completed_at, t);
    const existing = groups.get(label);
    if (existing) {
      existing.push(session);
    } else {
      groups.set(label, [session]);
    }
  }

  return Array.from(groups.entries()).map(([label, sessions]) => ({
    label,
    sessions,
  }));
}

export function PomodoroHistory({
  sessions,
  onDelete,
  onClearAll,
}: PomodoroHistoryProps) {
  const { t } = useTranslation();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const grouped = useMemo(() => groupByDate(sessions, t), [sessions, t]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("pomodoro.deleteFailed")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      await onClearAll();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("pomodoro.clearFailed")
      );
    } finally {
      setClearDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between px-4 py-3">
          <CardTitle className="text-base">{t("pomodoro.history")}</CardTitle>
          {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
            >
              {t("pomodoro.clearAll")}
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <History className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t("pomodoro.noSessions")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => (
                <div key={group.label}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {group.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate text-sm">
                            {session.task_label || t("pomodoro.focusSession")}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDuration(session.duration, t)}
                          </span>
                          <span>{formatTime(session.completed_at)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={deletingId === session.id}
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pomodoro.clearTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("pomodoro.clearDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll}>
              {t("pomodoro.clearAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
