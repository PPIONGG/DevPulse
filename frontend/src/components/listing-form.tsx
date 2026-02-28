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
import { useTranslation } from "@/providers/language-provider";
import { languages } from "@/config/languages";
import type { Listing, ListingInput } from "@/lib/types/database";

interface ListingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: Listing | null;
  onSubmit: (data: ListingInput) => Promise<void>;
}

const defaultValues: ListingInput = {
  title: "",
  description: "",
  preview_code: "",
  full_code: "",
  language: "javascript",
  tags: [],
  price_cents: 0,
  currency: "usd",
  is_published: false,
};

export function ListingForm({
  open,
  onOpenChange,
  listing,
  onSubmit,
}: ListingFormProps) {
  const { t } = useTranslation();
  const isEditing = !!listing;
  const initial: ListingInput = listing
    ? {
        title: listing.title,
        description: listing.description,
        preview_code: listing.preview_code,
        full_code: listing.full_code,
        language: listing.language,
        tags: listing.tags,
        price_cents: listing.price_cents,
        currency: listing.currency,
        is_published: listing.is_published,
      }
    : defaultValues;

  const [form, setForm] = useState<ListingInput>(initial);
  const [priceStr, setPriceStr] = useState(
    listing ? String(listing.price_cents / 100) : ""
  );
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (listing) {
        setForm({
          title: listing.title,
          description: listing.description,
          preview_code: listing.preview_code,
          full_code: listing.full_code,
          language: listing.language,
          tags: listing.tags,
          price_cents: listing.price_cents,
          currency: listing.currency,
          is_published: listing.is_published,
        });
        setPriceStr(String(listing.price_cents / 100));
      } else {
        setForm(defaultValues);
        setPriceStr("");
      }
      setTagInput("");
      setError(null);
    }
  }, [open, listing]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      if (listing) {
        setForm({
          title: listing.title,
          description: listing.description,
          preview_code: listing.preview_code,
          full_code: listing.full_code,
          language: listing.language,
          tags: listing.tags,
          price_cents: listing.price_cents,
          currency: listing.currency,
          is_published: listing.is_published,
        });
        setPriceStr(String(listing.price_cents / 100));
      } else {
        setForm(defaultValues);
        setPriceStr("");
      }
      setTagInput("");
    }
    onOpenChange(value);
  };

  const handlePriceChange = (value: string) => {
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setPriceStr(value);
      const num = parseFloat(value);
      setForm((prev) => ({
        ...prev,
        price_cents: isNaN(num) ? 0 : Math.round(num * 100),
      }));
    }
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
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("marketplace.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("marketplace.editListingTitle") : t("marketplace.newListingTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t("marketplace.formTitle")}</Label>
            <Input
              id="title"
              placeholder={t("marketplace.formTitlePlaceholder")}
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("marketplace.formDescription")}</Label>
            <Textarea
              id="description"
              placeholder={t("marketplace.formDescPlaceholder")}
              className="min-h-[80px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t("marketplace.formLanguage")}</Label>
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
              <Label htmlFor="price">{t("marketplace.formPrice")}</Label>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                placeholder={t("marketplace.formPricePlaceholder")}
                value={priceStr}
                onChange={(e) => handlePriceChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview_code">{t("marketplace.formPreviewCode")}</Label>
            <Textarea
              id="preview_code"
              placeholder={t("marketplace.formPreviewCodePlaceholder")}
              className="min-h-[120px] font-mono text-sm"
              value={form.preview_code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, preview_code: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_code">{t("marketplace.formFullCode")}</Label>
            <Textarea
              id="full_code"
              placeholder={t("marketplace.formFullCodePlaceholder")}
              className="min-h-[200px] font-mono text-sm"
              value={form.full_code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, full_code: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t("marketplace.formTags")}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder={t("marketplace.formTagsPlaceholder")}
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_published"
              checked={form.is_published}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  is_published: checked === true,
                }))
              }
            />
            <Label htmlFor="is_published" className="font-normal">
              {t("marketplace.formPublished")}
            </Label>
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
