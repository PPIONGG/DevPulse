"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getWorkLogs,
  createWorkLog as createWorkLogService,
  updateWorkLog as updateWorkLogService,
  deleteWorkLog as deleteWorkLogService,
} from "@/lib/services/work-logs";
import { useAuth } from "@/providers/auth-provider";
import type { WorkLog, WorkLogInput } from "@/lib/types/database";

export function useWorkLogs() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkLogs = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getWorkLogs(supabase, user.id);
      setWorkLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch work logs");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchWorkLogs();
  }, [fetchWorkLogs]);

  const createWorkLog = useCallback(
    async (input: WorkLogInput) => {
      if (!user) return;
      const created = await createWorkLogService(supabase, user.id, input);
      setWorkLogs((prev) => [created, ...prev]);
      return created;
    },
    [user, supabase]
  );

  const updateWorkLog = useCallback(
    async (workLogId: string, input: Partial<WorkLogInput>) => {
      const updated = await updateWorkLogService(supabase, workLogId, input);
      setWorkLogs((prev) =>
        prev.map((w) => (w.id === workLogId ? updated : w))
      );
      return updated;
    },
    [supabase]
  );

  const deleteWorkLog = useCallback(
    async (workLogId: string) => {
      await deleteWorkLogService(supabase, workLogId);
      setWorkLogs((prev) => prev.filter((w) => w.id !== workLogId));
    },
    [supabase]
  );

  return {
    workLogs,
    loading,
    error,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    refetch: fetchWorkLogs,
  };
}
