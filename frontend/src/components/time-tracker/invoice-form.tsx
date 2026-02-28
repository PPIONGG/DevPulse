"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { useTranslation } from "@/providers/language-provider";
import type { Client, Invoice, InvoiceInput, InvoiceLineItem } from "@/lib/types/database";

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  clients: Client[];
  onSubmit: (data: InvoiceInput) => Promise<void>;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function thirtyDaysLater(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const emptyLineItem: InvoiceLineItem = {
  description: "",
  hours: 0,
  rate: 0,
  amount: 0,
};

export function InvoiceForm({
  open,
  onOpenChange,
  invoice,
  clients,
  onSubmit,
}: InvoiceFormProps) {
  const { t } = useTranslation();
  const isEditing = !!invoice;
  const [clientId, setClientId] = useState<string>("none");
  const [dueDate, setDueDate] = useState(thirtyDaysLater());
  const [taxRateStr, setTaxRateStr] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([{ ...emptyLineItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (invoice) {
        setClientId(invoice.client_id ?? "none");
        setDueDate(invoice.due_date);
        setTaxRateStr(String(invoice.tax_rate));
        setCurrency(invoice.currency);
        setNotes(invoice.notes);
        setLineItems(
          invoice.line_items.length > 0
            ? invoice.line_items
            : [{ ...emptyLineItem }]
        );
      } else {
        setClientId("none");
        setDueDate(thirtyDaysLater());
        setTaxRateStr("0");
        setCurrency("USD");
        setNotes("");
        setLineItems([{ ...emptyLineItem }]);
      }
      setError(null);
    }
  }, [open, invoice]);

  const updateLineItem = (
    index: number,
    field: keyof InvoiceLineItem,
    value: string | number
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === "hours" || field === "rate") {
        item.amount = Math.round(item.hours * item.rate * 100) / 100;
      }
      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { ...emptyLineItem }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
  const taxRate = parseFloat(taxRateStr) || 0;
  const taxAmount = Math.round(subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dueDate) return;

    const input: InvoiceInput = {
      client_id: clientId === "none" ? null : clientId,
      due_date: dueDate,
      tax_rate: taxRate,
      currency,
      notes,
      line_items: lineItems.filter((li) => li.description.trim()),
    };

    setSaving(true);
    setError(null);
    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("timeTracker.saveInvoiceFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("timeTracker.editInvoice") : t("timeTracker.newInvoiceTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("timeTracker.invoiceClient")}</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("timeTracker.noClientOption")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("timeTracker.noClientOption")}</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-due-date">{t("timeTracker.dueDate")}</Label>
              <Input
                id="inv-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-currency">{t("timeTracker.currency")}</Label>
              <Input
                id="inv-currency"
                placeholder={t("timeTracker.currencyPlaceholder")}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-tax-rate">{t("timeTracker.taxRate")}</Label>
              <Input
                id="inv-tax-rate"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={taxRateStr}
                onChange={(e) => setTaxRateStr(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("timeTracker.lineItems")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-1 size-3" />
                {t("timeTracker.addItem")}
              </Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_80px_90px_32px] gap-2 text-xs font-medium text-muted-foreground">
                <span>{t("timeTracker.lineDescription")}</span>
                <span>{t("timeTracker.lineHours")}</span>
                <span>{t("timeTracker.lineRate")}</span>
                <span>{t("timeTracker.lineAmount")}</span>
                <span />
              </div>
              {lineItems.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_80px_80px_90px_32px] items-center gap-2"
                >
                  <Input
                    placeholder={t("timeTracker.lineDescPlaceholder")}
                    value={item.description}
                    onChange={(e) => updateLineItem(i, "description", e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={item.hours || ""}
                    onChange={(e) =>
                      updateLineItem(i, "hours", parseFloat(e.target.value) || 0)
                    }
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={item.rate || ""}
                    onChange={(e) =>
                      updateLineItem(i, "rate", parseFloat(e.target.value) || 0)
                    }
                  />
                  <span className="px-2 text-sm font-medium">
                    {item.amount.toFixed(2)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => removeLineItem(i)}
                    disabled={lineItems.length <= 1}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <div className="flex justify-between">
              <span>{t("timeTracker.subtotal")}</span>
              <span>{subtotal.toFixed(2)} {currency}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("timeTracker.tax")} ({taxRate}%)</span>
                <span>{taxAmount.toFixed(2)} {currency}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
              <span>{t("timeTracker.totalLabel")}</span>
              <span>{total.toFixed(2)} {currency}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-notes">{t("timeTracker.invoiceNotes")}</Label>
            <Textarea
              id="inv-notes"
              placeholder={t("timeTracker.invoiceNotesPlaceholder")}
              className="min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
