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
import { useTranslation } from "@/providers/language-provider";
import type { KanbanBoard, KanbanBoardInput } from "@/lib/types/database";

interface KanbanBoardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board?: KanbanBoard | null;
  onSubmit: (data: KanbanBoardInput) => Promise<void>;
}

const defaultValues: KanbanBoardInput = {
  title: "",
  description: "",
  is_favorite: false,
};

export function KanbanBoardForm({
  open,
  onOpenChange,
  board,
  onSubmit,
}: KanbanBoardFormProps) {
  const isEditing = !!board;
  const { t } = useTranslation();
  const [form, setForm] = useState<KanbanBoardInput>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        board
          ? {
              title: board.title,
              description: board.description,
              is_favorite: board.is_favorite,
            }
          : defaultValues
      );
      setError(null);
    }
  }, [open, board]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("kanban.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("kanban.editTitle") : t("kanban.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="board-title">{t("kanban.formTitle")}</Label>
            <Input
              id="board-title"
              placeholder={t("kanban.formTitlePlaceholder")}
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="board-desc">{t("kanban.formDescription")}</Label>
            <Textarea
              id="board-desc"
              placeholder={t("kanban.formDescPlaceholder")}
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
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
