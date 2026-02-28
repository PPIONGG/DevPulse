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
      setError(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              placeholder="Client name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-company">Company</Label>
            <Input
              id="client-company"
              placeholder="Company name"
              value={form.company}
              onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-address">Address</Label>
            <Textarea
              id="client-address"
              placeholder="Address"
              className="min-h-[60px]"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-rate">Hourly Rate</Label>
              <Input
                id="client-rate"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={rateStr}
                onChange={(e) => handleRateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-currency">Currency</Label>
              <Input
                id="client-currency"
                placeholder="USD"
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">Notes</Label>
            <Textarea
              id="client-notes"
              placeholder="Optional notes"
              className="min-h-[60px]"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
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
