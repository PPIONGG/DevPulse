"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getCalculations,
  createCalculation as createCalculationService,
  deleteCalculation as deleteCalculationService,
  clearCalculations as clearCalculationsService,
} from "@/lib/services/calculations";
import { useAuth } from "@/providers/auth-provider";
import type { Calculation } from "@/lib/types/database";

export function useCalculator() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getCalculations();
      if (mountedRef.current) {
        setHistory(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch history"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const calculate = useCallback(
    async (expression: string, result: string) => {
      if (!user) return;
      const created = await createCalculationService({ expression, result });
      if (mountedRef.current) {
        setHistory((prev) => [created, ...prev]);
      }
      return created;
    },
    [user]
  );

  const deleteEntry = useCallback(async (id: string) => {
    await deleteCalculationService(id);
    if (mountedRef.current) {
      setHistory((prev) => prev.filter((c) => c.id !== id));
      toast.success("Entry deleted");
    }
  }, []);

  const clearHistory = useCallback(async () => {
    await clearCalculationsService();
    if (mountedRef.current) {
      setHistory([]);
      toast.success("History cleared");
    }
  }, []);

  return {
    history,
    loading,
    error,
    calculate,
    deleteEntry,
    clearHistory,
    refetch: fetchHistory,
  };
}
