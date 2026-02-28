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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languages } from "@/config/languages";
import { useTranslation } from "@/providers/language-provider";
import type { CodeSnippet, CodeSnippetInput } from "@/lib/types/database";

interface SnippetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snippet?: CodeSnippet | null;
  onSubmit: (data: CodeSnippetInput) => Promise<void>;
}

const defaultValues: CodeSnippetInput = {
  title: "",
  code: "",
  language: "plaintext",
  description: "",
  tags: [],
  is_public: false,
  is_favorite: false,
};

export function SnippetForm({
  open,
  onOpenChange,
  snippet,
  onSubmit,
}: SnippetFormProps) {
  const { t } = useTranslation();
  const isEditing = !!snippet;
  const initial: CodeSnippetInput = snippet
    ? {
        title: snippet.title,
        code: snippet.code,
        language: snippet.language,
        description: snippet.description,
        tags: snippet.tags,
        is_public: snippet.is_public,
        is_favorite: snippet.is_favorite,
      }
    : defaultValues;

  const [form, setForm] = useState<CodeSnippetInput>(initial);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form state when dialog opens or snippet changes
  useEffect(() => {
    if (open) {
      setForm(
        snippet
          ? {
              title: snippet.title,
              code: snippet.code,
              language: snippet.language,
              description: snippet.description,
              tags: snippet.tags,
              is_public: snippet.is_public,
              is_favorite: snippet.is_favorite,
            }
          : defaultValues
      );
      setTagInput("");
      setError(null);
    }
  }, [open, snippet]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      setForm(
        snippet
          ? {
              title: snippet.title,
              code: snippet.code,
              language: snippet.language,
              description: snippet.description,
              tags: snippet.tags,
              is_public: snippet.is_public,
              is_favorite: snippet.is_favorite,
            }
          : defaultValues
      );
      setTagInput("");
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
    if (!form.title.trim() || !form.code.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("snippets.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("snippets.editTitle") : t("snippets.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">{t("snippets.formTitle")}</Label>
            <Input
              id="title"
              placeholder={t("snippets.formTitlePlaceholder")}
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">{t("snippets.formLanguage")}</Label>
            <Select
              value={form.language}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">{t("snippets.formCode")}</Label>
            <Textarea
              id="code"
              placeholder={t("snippets.formCodePlaceholder")}
              className="min-h-[200px] font-mono text-sm"
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, code: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("snippets.formDescription")}</Label>
            <Textarea
              id="description"
              placeholder={t("snippets.formDescPlaceholder")}
              className="min-h-[80px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t("snippets.formTags")}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder={t("snippets.formTagsPlaceholder")}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                {t("common.add")}
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

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_public"
                checked={form.is_public}
                disabled={!!snippet?.copied_from}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    is_public: checked === true,
                  }))
                }
              />
              <Label htmlFor="is_public" className="font-normal">
                {t("snippets.formPublic")}
                {snippet?.copied_from && (
                  <span className="ml-1 text-xs text-muted-foreground">{t("snippets.formCopied")}</span>
                )}
              </Label>
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
                {t("snippets.formFavorite")}
              </Label>
            </div>
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
