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
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Collection" : "New Collection"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="col-title">Name</Label>
            <Input
              id="col-title"
              placeholder="e.g. My API"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="col-desc">Description</Label>
            <Textarea
              id="col-desc"
              placeholder="Optional description"
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
