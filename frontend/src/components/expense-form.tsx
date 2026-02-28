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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { expenseCategories, currencies } from "@/config/expense-categories";
import type { Expense, ExpenseInput } from "@/lib/types/database";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSubmit: (data: ExpenseInput) => Promise<void>;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const defaultValues: ExpenseInput = {
  title: "",
  amount: 0,
  currency: "USD",
  category: "other",
  date: todayString(),
  notes: "",
  is_recurring: false,
};

export function ExpenseForm({
  open,
  onOpenChange,
  expense,
  onSubmit,
}: ExpenseFormProps) {
  const isEditing = !!expense;
  const initial: ExpenseInput = expense
    ? {
        title: expense.title,
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        date: expense.date,
        notes: expense.notes,
        is_recurring: expense.is_recurring,
      }
    : defaultValues;

  const [form, setForm] = useState<ExpenseInput>(initial);
  const [amountStr, setAmountStr] = useState(
    expense ? String(expense.amount) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (expense) {
        setForm({
          title: expense.title,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          date: expense.date,
          notes: expense.notes,
          is_recurring: expense.is_recurring,
        });
        setAmountStr(String(expense.amount));
      } else {
        setForm({ ...defaultValues, date: todayString() });
        setAmountStr("");
      }
      setError(null);
    }
  }, [open, expense]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      if (expense) {
        setForm({
          title: expense.title,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          date: expense.date,
          notes: expense.notes,
          is_recurring: expense.is_recurring,
        });
        setAmountStr(String(expense.amount));
      } else {
        setForm({ ...defaultValues, date: todayString() });
        setAmountStr("");
      }
    }
    onOpenChange(value);
  };

  const handleAmountChange = (value: string) => {
    // Allow only valid decimal numbers
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmountStr(value);
      const num = parseFloat(value);
      setForm((prev) => ({ ...prev, amount: isNaN(num) ? 0 : num }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.amount <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Expense" : "New Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Lunch, Uber ride, Netflix"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes"
              className="min-h-[60px]"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_recurring"
              checked={form.is_recurring}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  is_recurring: checked === true,
                }))
              }
            />
            <Label htmlFor="is_recurring" className="font-normal">
              Recurring expense
            </Label>
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
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
