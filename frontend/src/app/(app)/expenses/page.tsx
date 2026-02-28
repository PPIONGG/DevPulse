"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExpenseCard } from "@/components/expense-card";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseSummary, getMonthOptions } from "@/components/expense-summary";
import { ExpenseCardSkeleton } from "@/components/skeletons";
import { useExpenses } from "@/hooks/use-expenses";
import { toast } from "sonner";
import { expenseCategories } from "@/config/expense-categories";
import type { Expense, ExpenseInput } from "@/lib/types/database";

export default function ExpensesPage() {
  const {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch,
  } = useExpenses();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const monthOptions = useMemo(() => getMonthOptions(expenses), [expenses]);

  const filtered = useMemo(() => {
    let result = expenses;
    if (category !== "all") {
      result = result.filter((e) => e.category === category);
    }
    if (month !== "all") {
      result = result.filter((e) => e.date.startsWith(month));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [expenses, search, category, month]);

  // Determine the dominant currency for the summary display
  const summaryCurrency = useMemo(() => {
    if (filtered.length === 0) return "USD";
    const counts = new Map<string, number>();
    for (const e of filtered) {
      counts.set(e.currency, (counts.get(e.currency) ?? 0) + 1);
    }
    let maxCurrency = "USD";
    let maxCount = 0;
    for (const [c, n] of counts) {
      if (n > maxCount) {
        maxCount = n;
        maxCurrency = c;
      }
    }
    return maxCurrency;
  }, [filtered]);

  const hasFilters = search.trim() || category !== "all" || month !== "all";

  const handleCreate = async (data: ExpenseInput) => {
    await createExpense(data);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleUpdate = async (data: ExpenseInput) => {
    if (!editingExpense) return;
    await updateExpense(editingExpense.id, data);
    setEditingExpense(null);
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    try {
      await deleteExpense(deletingExpense.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setDeletingExpense(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
          <p className="mt-1 text-muted-foreground">
            Track and manage your expenses.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Expense
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {expenseCategories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {monthOptions.length > 0 && (
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ExpenseCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {hasFilters ? "No matching expenses" : "No expenses yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different search term, category, or month."
              : "Start tracking your expenses."}
          </p>
          {!hasFilters && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              New Expense
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {filtered.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onDelete={setDeletingExpense}
              />
            ))}
          </div>
          <div className="lg:sticky lg:top-4 lg:self-start">
            <ExpenseSummary expenses={filtered} currency={summaryCurrency} />
          </div>
        </div>
      )}

      <ExpenseForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        expense={editingExpense}
        onSubmit={editingExpense ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingExpense?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
