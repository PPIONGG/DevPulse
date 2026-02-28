"use client";

import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cardPriorities } from "@/config/kanban-config";
import type { KanbanCard, KanbanCardInput } from "@/lib/types/database";

interface KanbanCardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: KanbanCard | null;
  onSubmit: (data: KanbanCardInput) => Promise<void>;
}

const defaultValues: KanbanCardInput = {
  title: "",
  description: "",
  priority: "medium",
  labels: [],
  due_date: null,
};

export function KanbanCardForm({
  open,
  onOpenChange,
  card,
  onSubmit,
}: KanbanCardFormProps) {
  const isEditing = !!card;
  const [form, setForm] = useState<KanbanCardInput>(defaultValues);
  const [labelInput, setLabelInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        card
          ? {
              title: card.title,
              description: card.description,
              priority: card.priority,
              labels: card.labels,
              due_date: card.due_date,
            }
          : defaultValues
      );
      setLabelInput("");
      setError(null);
    }
  }, [open, card]);

  const addLabel = () => {
    const label = labelInput.trim().toLowerCase();
    if (label && !form.labels.includes(label)) {
      setForm((prev) => ({ ...prev, labels: [...prev.labels, label] }));
    }
    setLabelInput("");
  };

  const removeLabel = (label: string) => {
    setForm((prev) => ({
      ...prev,
      labels: prev.labels.filter((l) => l !== label),
    }));
  };

  const handleLabelKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLabel();
    }
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
      setError(err instanceof Error ? err.message : "Failed to save card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Card" : "New Card"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="card-title">Title</Label>
            <Input
              id="card-title"
              placeholder="Card title"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-desc">Description</Label>
            <Textarea
              id="card-desc"
              placeholder="Optional description"
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card-priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: value as KanbanCardInput["priority"],
                  }))
                }
              >
                <SelectTrigger id="card-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cardPriorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-due">Due Date</Label>
              <Input
                id="card-due"
                type="date"
                value={form.due_date ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    due_date: e.target.value || null,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-labels">Labels</Label>
            <div className="flex gap-2">
              <Input
                id="card-labels"
                placeholder="Type a label and press Enter"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleLabelKeyDown}
              />
              <Button type="button" variant="outline" onClick={addLabel}>
                Add
              </Button>
            </div>
            {form.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {form.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="gap-1">
                    {label}
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="ml-0.5 rounded-full hover:bg-muted"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
