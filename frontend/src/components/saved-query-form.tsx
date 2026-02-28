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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { SavedQuery, SavedQueryInput } from "@/lib/types/database";

interface SavedQueryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedQuery?: SavedQuery | null;
  initialQuery?: string;
  connectionId?: string | null;
  onSubmit: (data: SavedQueryInput) => Promise<void>;
}

const defaultValues: SavedQueryInput = {
  connection_id: null,
  title: "",
  query: "",
  description: "",
  tags: [],
  is_favorite: false,
};

export function SavedQueryForm({
  open,
  onOpenChange,
  savedQuery,
  initialQuery,
  connectionId,
  onSubmit,
}: SavedQueryFormProps) {
  const isEditing = !!savedQuery;
  const [form, setForm] = useState<SavedQueryInput>(defaultValues);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (savedQuery) {
        setForm({
          connection_id: savedQuery.connection_id ?? null,
          title: savedQuery.title,
          query: savedQuery.query,
          description: savedQuery.description,
          tags: savedQuery.tags || [],
          is_favorite: savedQuery.is_favorite,
        });
      } else {
        setForm({
          ...defaultValues,
          query: initialQuery || "",
          connection_id: connectionId || null,
        });
      }
      setTagInput("");
      setError(null);
    }
  }, [open, savedQuery, initialQuery, connectionId]);

  const handleOpenChange = (value: boolean) => {
    if (value && !savedQuery) {
      setForm({
        ...defaultValues,
        query: initialQuery || "",
        connection_id: connectionId || null,
      });
    }
    onOpenChange(value);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.query.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save query");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Saved Query" : "Save Query"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sq-title">Title</Label>
            <Input
              id="sq-title"
              placeholder="e.g. Active Users Query"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sq-description">Description</Label>
            <Textarea
              id="sq-description"
              placeholder="Optional description"
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sq-query">Query</Label>
            <Textarea
              id="sq-query"
              placeholder="SELECT * FROM ..."
              className="min-h-[80px] font-mono text-sm"
              value={form.query}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, query: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sq-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="sq-tags"
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      className="ml-0.5 hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="sq-favorite"
              checked={form.is_favorite}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, is_favorite: checked === true }))
              }
            />
            <Label htmlFor="sq-favorite" className="text-sm font-normal">
              Add to favorites
            </Label>
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
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Save Query"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
