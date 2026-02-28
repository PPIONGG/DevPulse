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
import type { Client, ClientInput } from "@/lib/types/database";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: ClientInput) => Promise<void>;
}

const defaultValues: ClientInput = {
  name: "",
  email: "",
  company: "",
  address: "",
  phone: "",
  notes: "",
  hourly_rate: 0,
  currency: "USD",
};

export function ClientForm({ open, onOpenChange, client, onSubmit }: ClientFormProps) {
  const { t } = useTranslation();
  const isEditing = !!client;
  const [form, setForm] = useState<ClientInput>(defaultValues);
  const [rateStr, setRateStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (client) {
        setForm({
          name: client.name,
          email: client.email,
          company: client.company,
          address: client.address,
          phone: client.phone,
          notes: client.notes,
          hourly_rate: client.hourly_rate,
          currency: client.currency,
        });
        setRateStr(client.hourly_rate ? String(client.hourly_rate) : "");
      } else {
        setForm(defaultValues);
        setRateStr("");
      }
      setError(null);
    }
  }, [open, client]);

  const handleRateChange = (value: string) => {
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setRateStr(value);
      const num = parseFloat(value);
      setForm((prev) => ({ ...prev, hourly_rate: isNaN(num) ? 0 : num }));
    }
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
      setError(err instanceof Error ? err.message : t("timeTracker.saveClientFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("timeTracker.editClient") : t("timeTracker.newClientTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="client-name">{t("timeTracker.clientName")}</Label>
            <Input
              id="client-name"
              placeholder={t("timeTracker.clientNamePlaceholder")}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-email">{t("timeTracker.email")}</Label>
              <Input
                id="client-email"
                type="email"
                placeholder={t("timeTracker.emailPlaceholder")}
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">{t("timeTracker.phone")}</Label>
              <Input
                id="client-phone"
                placeholder={t("timeTracker.phonePlaceholder")}
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-company">{t("timeTracker.company")}</Label>
            <Input
              id="client-company"
              placeholder={t("timeTracker.companyPlaceholder")}
              value={form.company}
              onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-address">{t("timeTracker.address")}</Label>
            <Textarea
              id="client-address"
              placeholder={t("timeTracker.addressPlaceholder")}
              className="min-h-[60px]"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-rate">{t("timeTracker.hourlyRate")}</Label>
              <Input
                id="client-rate"
                type="text"
                inputMode="decimal"
                placeholder={t("timeTracker.hourlyRatePlaceholder")}
                value={rateStr}
                onChange={(e) => handleRateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-currency">{t("timeTracker.currency")}</Label>
              <Input
                id="client-currency"
                placeholder={t("timeTracker.currencyPlaceholder")}
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">{t("timeTracker.notes")}</Label>
            <Textarea
              id="client-notes"
              placeholder={t("timeTracker.notesPlaceholder")}
              className="min-h-[60px]"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
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
