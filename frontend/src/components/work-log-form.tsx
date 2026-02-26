"use client";

import { useState, type FormEvent } from "react";
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
import { workLogCategories } from "@/config/categories";
import type { WorkLog, WorkLogInput } from "@/lib/types/database";

interface WorkLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workLog?: WorkLog | null;
  onSubmit: (data: WorkLogInput) => Promise<void>;
}

const today = () => new Date().toISOString().split("T")[0];

const defaultValues: WorkLogInput = {
  title: "",
  content: "",
  date: today(),
  category: "other",
  hours_spent: null,
};

export function WorkLogForm({
  open,
  onOpenChange,
  workLog,
  onSubmit,
}: WorkLogFormProps) {
  const isEditing = !!workLog;
  const initial: WorkLogInput = workLog
    ? {
        title: workLog.title,
        content: workLog.content,
        date: workLog.date,
        category: workLog.category,
        hours_spent: workLog.hours_spent,
      }
    : { ...defaultValues, date: today() };

  const [form, setForm] = useState<WorkLogInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      setForm(
        workLog
          ? {
              title: workLog.title,
              content: workLog.content,
              date: workLog.date,
              category: workLog.category,
              hours_spent: workLog.hours_spent,
            }
          : { ...defaultValues, date: today() }
      );
      setError(null);
    }
    onOpenChange(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save work log");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Work Log" : "New Work Log"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What did you work on?"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Spent</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                placeholder="0"
                value={form.hours_spent ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    hours_spent: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workLogCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Notes</Label>
            <Textarea
              id="content"
              placeholder="Details about your work..."
              className="min-h-[120px]"
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
