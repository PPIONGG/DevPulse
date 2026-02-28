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
import { environments } from "@/config/environments";
import { useTranslation } from "@/providers/language-provider";
import type { EnvVault, EnvVaultInput } from "@/lib/types/database";

interface VaultFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vault?: EnvVault | null;
  onSubmit: (data: EnvVaultInput) => Promise<void>;
}

const defaultValues: EnvVaultInput = {
  name: "",
  environment: "development",
  description: "",
  is_favorite: false,
};

export function VaultForm({
  open,
  onOpenChange,
  vault,
  onSubmit,
}: VaultFormProps) {
  const { t } = useTranslation();
  const isEditing = !!vault;
  const initial: EnvVaultInput = vault
    ? {
        name: vault.name,
        environment: vault.environment,
        description: vault.description,
        is_favorite: vault.is_favorite,
      }
    : defaultValues;

  const [form, setForm] = useState<EnvVaultInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (vault) {
        setForm({
          name: vault.name,
          environment: vault.environment,
          description: vault.description,
          is_favorite: vault.is_favorite,
        });
      } else {
        setForm({ ...defaultValues });
      }
      setError(null);
    }
  }, [open, vault]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      if (vault) {
        setForm({
          name: vault.name,
          environment: vault.environment,
          description: vault.description,
          is_favorite: vault.is_favorite,
        });
      } else {
        setForm({ ...defaultValues });
      }
    }
    onOpenChange(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("envVault.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("envVault.editTitle") : t("envVault.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("envVault.formName")}</Label>
            <Input
              id="name"
              placeholder={t("envVault.formNamePlaceholder")}
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">{t("envVault.formEnvironment")}</Label>
            <Select
              value={form.environment}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, environment: value }))
              }
            >
              <SelectTrigger id="environment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.value} value={env.value}>
                    {env.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("envVault.formDescription")}</Label>
            <Textarea
              id="description"
              placeholder={t("envVault.formDescPlaceholder")}
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
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
