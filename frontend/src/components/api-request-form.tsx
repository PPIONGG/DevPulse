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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { httpMethods } from "@/config/api-playground";
import { useTranslation } from "@/providers/language-provider";
import type { ApiCollection, ApiRequestInput } from "@/lib/types/database";

interface ApiRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: ApiCollection[];
  onSubmit: (data: ApiRequestInput) => Promise<unknown>;
}

export function ApiRequestForm({
  open,
  onOpenChange,
  collections,
  onSubmit,
}: ApiRequestFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [method, setMethod] = useState("GET");
  const [collectionId, setCollectionId] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setMethod("GET");
      setCollectionId("none");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title,
        method,
        collection_id: collectionId === "none" ? null : collectionId,
        url: "",
        headers: [],
        query_params: [],
        body_type: "none",
        body: "",
        env_vault_id: null,
        sort_order: 0,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("apiPlayground.createRequestFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("apiPlayground.newRequest")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="req-title">{t("apiPlayground.requestName")}</Label>
            <Input
              id="req-title"
              placeholder={t("apiPlayground.requestNamePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-method">{t("apiPlayground.requestMethod")}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="req-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {httpMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-collection">{t("apiPlayground.requestCollection")}</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger id="req-collection">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("apiPlayground.noCollection")}</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("apiPlayground.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
