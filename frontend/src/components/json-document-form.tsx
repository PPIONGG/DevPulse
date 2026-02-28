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
import type { JsonDocument, JsonDocumentInput } from "@/lib/types/database";

interface JsonDocumentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: JsonDocument | null;
  onSubmit: (data: JsonDocumentInput) => Promise<void>;
  initialContent?: string;
  initialFormat?: "json" | "yaml";
}

const defaultValues: JsonDocumentInput = {
  title: "",
  content: "",
  format: "json",
  description: "",
  tags: [],
  is_favorite: false,
};

export function JsonDocumentForm({
  open,
  onOpenChange,
  document,
  onSubmit,
  initialContent,
  initialFormat,
}: JsonDocumentFormProps) {
  const isEditing = !!document;
  const initial: JsonDocumentInput = document
    ? {
        title: document.title,
        content: document.content,
        format: document.format,
        description: document.description,
        tags: document.tags,
        is_favorite: document.is_favorite,
      }
    : {
        ...defaultValues,
        content: initialContent || "",
        format: initialFormat || "json",
      };

  const [form, setForm] = useState<JsonDocumentInput>(initial);
  const [tagsStr, setTagsStr] = useState(initial.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (document) {
        const vals: JsonDocumentInput = {
          title: document.title,
          content: document.content,
          format: document.format,
          description: document.description,
          tags: document.tags,
          is_favorite: document.is_favorite,
        };
        setForm(vals);
        setTagsStr(document.tags.join(", "));
      } else {
        const vals: JsonDocumentInput = {
          ...defaultValues,
          content: initialContent || "",
          format: initialFormat || "json",
        };
        setForm(vals);
        setTagsStr("");
      }
      setError(null);
    }
  }, [open, document, initialContent, initialFormat]);

  const handleTagsChange = (value: string) => {
    setTagsStr(value);
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, tags }));
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
      setError(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Document" : "Save Document"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g. API Response, Config File"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-content">Content</Label>
            <Textarea
              id="doc-content"
              placeholder="JSON or YAML content"
              className="min-h-[120px] font-mono text-sm"
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-format">Format</Label>
            <Select
              value={form.format}
              onValueChange={(value: "json" | "yaml") =>
                setForm((prev) => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger id="doc-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="yaml">YAML</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-description">Description</Label>
            <Textarea
              id="doc-description"
              placeholder="Optional description"
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-tags">Tags</Label>
            <Input
              id="doc-tags"
              placeholder="Comma-separated tags (e.g. api, config)"
              value={tagsStr}
              onChange={(e) => handleTagsChange(e.target.value)}
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
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
