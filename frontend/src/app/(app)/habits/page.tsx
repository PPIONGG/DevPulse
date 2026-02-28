"use client";

import { useState, useMemo } from "react";
import { Plus, Target } from "lucide-react";
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
import { HabitCard } from "@/components/habit-card";
import { HabitForm } from "@/components/habit-form";
import { HabitCardSkeleton } from "@/components/skeletons";
import { useHabits } from "@/hooks/use-habits";
import { toast } from "sonner";
import { useTranslation } from "@/providers/language-provider";
import type { HabitWithStats, HabitInput } from "@/lib/types/database";

export default function HabitsPage() {
  const {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    toggleCompletion,
    refetch,
  } = useHabits();
  const { t } = useTranslation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<HabitWithStats | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeHabits = useMemo(
    () => habits.filter((h) => !h.is_archived),
    [habits]
  );
  const archivedHabits = useMemo(
    () => habits.filter((h) => h.is_archived),
    [habits]
  );

  const handleCreate = async (data: HabitInput) => {
    await createHabit(data);
  };

  const handleEdit = (habit: HabitWithStats) => {
    setEditingHabit(habit);
    setFormOpen(true);
  };

  const handleUpdate = async (data: HabitInput) => {
    if (!editingHabit) return;
    await updateHabit(editingHabit.id, data);
    setEditingHabit(null);
  };

  const handleArchive = async (habit: HabitWithStats) => {
    try {
      await archiveHabit(habit.id, !habit.is_archived);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("habits.archiveFailed")
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingHabit) return;
    try {
      await deleteHabit(deletingHabit.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("habits.deleteFailed")
      );
    } finally {
      setDeletingHabit(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingHabit(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("habits.title")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("habits.subtitle")}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t("habits.new")}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <HabitCardSkeleton key={i} />
          ))}
        </div>
      ) : activeHabits.length === 0 && !showArchived ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Target className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">{t("habits.empty")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("habits.emptyDesc")}
          </p>
          <Button className="mt-4" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t("habits.new")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onEdit={handleEdit}
              onDelete={setDeletingHabit}
              onArchive={handleArchive}
              onToggle={toggleCompletion}
            />
          ))}
        </div>
      )}

      {archivedHabits.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? t("habits.hideArchived") : t("habits.showArchived")} ({archivedHabits.length})
          </Button>
          {showArchived && (
            <div className="mt-3 space-y-3 opacity-60">
              {archivedHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onEdit={handleEdit}
                  onDelete={setDeletingHabit}
                  onArchive={handleArchive}
                  onToggle={toggleCompletion}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <HabitForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        habit={editingHabit}
        onSubmit={editingHabit ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingHabit}
        onOpenChange={(open) => !open && setDeletingHabit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("habits.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("habits.deleteDescPrefix")} {deletingHabit?.title} {t("habits.deleteDescSuffix")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
