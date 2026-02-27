"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
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
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchWorkLogs = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getWorkLogs(supabase, user.id);
      if (mountedRef.current) {
        setWorkLogs(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch work logs");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading, supabase]);

  useEffect(() => {
    fetchWorkLogs();
  }, [fetchWorkLogs]);

  const createWorkLog = useCallback(
    async (input: WorkLogInput) => {
      if (!user) return;
      const created = await createWorkLogService(supabase, user.id, input);
      if (mountedRef.current) {
        setWorkLogs((prev) => [created, ...prev]);
        toast.success("Work log created");
      }
      return created;
    },
    [user, supabase]
  );

  const updateWorkLog = useCallback(
    async (workLogId: string, input: Partial<WorkLogInput>) => {
      const updated = await updateWorkLogService(supabase, workLogId, input);
      if (mountedRef.current) {
        setWorkLogs((prev) =>
          prev.map((w) => (w.id === workLogId ? updated : w))
        );
        toast.success("Work log updated");
      }
      return updated;
    },
    [supabase]
  );

  const deleteWorkLog = useCallback(
    async (workLogId: string) => {
      await deleteWorkLogService(supabase, workLogId);
      if (mountedRef.current) {
        setWorkLogs((prev) => prev.filter((w) => w.id !== workLogId));
        toast.success("Work log deleted");
      }
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
