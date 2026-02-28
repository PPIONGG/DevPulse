"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { habitColors } from "@/config/habit-colors";
import { useTranslation } from "@/providers/language-provider";
import type { Habit, HabitInput } from "@/lib/types/database";

interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
  onSubmit: (data: HabitInput) => Promise<void>;
}

const defaultValues: HabitInput = {
  title: "",
  description: "",
  color: "#3b82f6",
  frequency: "daily",
  target_days: 1,
};

export function HabitForm({
  open,
  onOpenChange,
  habit,
  onSubmit,
}: HabitFormProps) {
  const { t } = useTranslation();
  const isEditing = !!habit;
  const initial: HabitInput = habit
    ? {
        title: habit.title,
        description: habit.description,
        color: habit.color,
        frequency: habit.frequency,
        target_days: habit.target_days,
      }
    : defaultValues;

  const [form, setForm] = useState<HabitInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        habit
          ? {
              title: habit.title,
              description: habit.description,
              color: habit.color,
              frequency: habit.frequency,
              target_days: habit.target_days,
            }
          : defaultValues
      );
      setError(null);
    }
  }, [open, habit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("habits.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("habits.editTitle") : t("habits.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t("habits.formTitle")}</Label>
            <Input
              id="title"
              placeholder={t("habits.formTitlePlaceholder")}
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("habits.formDescription")}</Label>
            <Textarea
              id="description"
              placeholder={t("habits.formDescPlaceholder")}
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t("habits.formColor")}</Label>
            <div className="flex gap-2">
              {habitColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, color: c.value }))
                  }
                  className={`size-8 rounded-full transition-all ${
                    form.color === c.value
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">{t("habits.formFrequency")}</Label>
            <Select
              value={form.frequency}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  frequency: value as HabitInput["frequency"],
                }))
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("habits.daily")}</SelectItem>
                <SelectItem value="weekdays">{t("habits.weekdays")}</SelectItem>
                <SelectItem value="weekly">{t("habits.weekly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.frequency === "weekly" && (
            <div className="space-y-2">
              <Label htmlFor="target_days">{t("habits.formTargetDays")}</Label>
              <Input
                id="target_days"
                type="number"
                min={1}
                max={7}
                value={form.target_days}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    target_days: Math.max(
                      1,
                      Math.min(7, parseInt(e.target.value) || 1)
                    ),
                  }))
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : isEditing ? t("common.saveChanges") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
