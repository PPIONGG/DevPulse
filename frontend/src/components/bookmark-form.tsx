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
import { Checkbox } from "@/components/ui/checkbox";
import type { Bookmark, BookmarkInput } from "@/lib/types/database";

interface BookmarkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark?: Bookmark | null;
  onSubmit: (data: BookmarkInput) => Promise<void>;
}

const defaultValues: BookmarkInput = {
  title: "",
  url: "",
  description: "",
  tags: [],
  is_favorite: false,
};

export function BookmarkForm({
  open,
  onOpenChange,
  bookmark,
  onSubmit,
}: BookmarkFormProps) {
  const isEditing = !!bookmark;
  const initial: BookmarkInput = bookmark
    ? {
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        tags: bookmark.tags,
        is_favorite: bookmark.is_favorite,
      }
    : defaultValues;

  const [form, setForm] = useState<BookmarkInput>(initial);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        bookmark
          ? {
              title: bookmark.title,
              url: bookmark.url,
              description: bookmark.description,
              tags: bookmark.tags,
              is_favorite: bookmark.is_favorite,
            }
          : defaultValues
      );
      setTagInput("");
      setError(null);
    }
  }, [open, bookmark]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      setForm(
        bookmark
          ? {
              title: bookmark.title,
              url: bookmark.url,
              description: bookmark.description,
              tags: bookmark.tags,
              is_favorite: bookmark.is_favorite,
            }
          : defaultValues
      );
      setTagInput("");
      setError(null);
    }
    onOpenChange(value);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bookmark");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Bookmark" : "New Bookmark"}
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
              placeholder="Bookmark title"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, url: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              className="min-h-[80px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <Button type="button" variant="outline" onClick={addTag}>
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
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full hover:bg-muted"
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
              id="is_favorite"
              checked={form.is_favorite}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  is_favorite: checked === true,
                }))
              }
            />
            <Label htmlFor="is_favorite" className="font-normal">
              Favorite
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
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
