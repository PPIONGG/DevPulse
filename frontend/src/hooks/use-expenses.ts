"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getExpenses,
  createExpense as createExpenseService,
  updateExpense as updateExpenseService,
  deleteExpense as deleteExpenseService,
} from "@/lib/services/expenses";
import { useAuth } from "@/providers/auth-provider";
import type { Expense, ExpenseInput } from "@/lib/types/database";

export function useExpenses() {
  const { user, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getExpenses();
      if (mountedRef.current) {
        setExpenses(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch expenses");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = useCallback(
    async (input: ExpenseInput) => {
      if (!user) return;
      const created = await createExpenseService(input);
      if (mountedRef.current) {
        setExpenses((prev) => [created, ...prev]);
        toast.success("Expense created");
      }
      return created;
    },
    [user]
  );

  const updateExpense = useCallback(
    async (expenseId: string, input: ExpenseInput) => {
      const updated = await updateExpenseService(expenseId, input);
      if (mountedRef.current) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === expenseId ? updated : e))
        );
        toast.success("Expense updated");
      }
      return updated;
    },
    []
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      await deleteExpenseService(expenseId);
      if (mountedRef.current) {
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        toast.success("Expense deleted");
      }
    },
    []
  );

  return {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
