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
import type { ApiCollection, ApiCollectionInput } from "@/lib/types/database";

interface ApiCollectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: ApiCollection | null;
  onSubmit: (data: ApiCollectionInput) => Promise<void>;
}

const defaultValues: ApiCollectionInput = {
  title: "",
  description: "",
  is_favorite: false,
};

export function ApiCollectionForm({
  open,
  onOpenChange,
  collection,
  onSubmit,
}: ApiCollectionFormProps) {
  const { t } = useTranslation();
  const isEditing = !!collection;
  const [form, setForm] = useState<ApiCollectionInput>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (collection) {
        setForm({
          title: collection.title,
          description: collection.description,
          is_favorite: collection.is_favorite,
        });
      } else {
        setForm({ ...defaultValues });
      }
      setError(null);
    }
  }, [open, collection]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("apiPlayground.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("apiPlayground.editCollection") : t("apiPlayground.newCollection")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="col-title">{t("apiPlayground.collectionName")}</Label>
            <Input
              id="col-title"
              placeholder={t("apiPlayground.collectionNamePlaceholder")}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="col-desc">{t("apiPlayground.collectionDescription")}</Label>
            <Textarea
              id="col-desc"
              placeholder={t("apiPlayground.collectionDescPlaceholder")}
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
