"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getWorkflows,
  createWorkflow as createWorkflowService,
  updateWorkflow as updateWorkflowService,
  deleteWorkflow as deleteWorkflowService,
  toggleWorkflow as toggleWorkflowService,
  runWorkflow as runWorkflowService,
  getWorkflow as getWorkflowService,
  getWorkflowRuns as getWorkflowRunsService,
  getStepLogs as getStepLogsService,
} from "@/lib/services/workflows";
import { useAuth } from "@/providers/auth-provider";
import type {
  Workflow,
  WorkflowInput,
  WorkflowRun,
  WorkflowStepLog,
} from "@/lib/types/database";

export function useWorkflows() {
  const { user, loading: authLoading } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchWorkflows = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getWorkflows();
      if (mountedRef.current) {
        setWorkflows(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch workflows");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createWorkflow = useCallback(
    async (input: WorkflowInput) => {
      if (!user) return;
      const created = await createWorkflowService(input);
      if (mountedRef.current) {
        setWorkflows((prev) => [created, ...prev]);
        toast.success("Workflow created");
      }
      return created;
    },
    [user]
  );

  const updateWorkflow = useCallback(
    async (workflowId: string, input: WorkflowInput) => {
      const updated = await updateWorkflowService(workflowId, input);
      if (mountedRef.current) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflowId ? updated : w))
        );
        toast.success("Workflow updated");
      }
      return updated;
    },
    []
  );

  const deleteWorkflow = useCallback(
    async (workflowId: string) => {
      await deleteWorkflowService(workflowId);
      if (mountedRef.current) {
        setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
        toast.success("Workflow deleted");
      }
    },
    []
  );

  const toggleEnabled = useCallback(
    async (workflowId: string) => {
      const updated = await toggleWorkflowService(workflowId);
      if (mountedRef.current) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflowId ? updated : w))
        );
        toast.success(updated.is_enabled ? "Workflow enabled" : "Workflow disabled");
      }
      return updated;
    },
    []
  );

  const runManual = useCallback(
    async (workflowId: string) => {
      const run = await runWorkflowService(workflowId);
      if (mountedRef.current) {
        // Refetch to get updated run count and last_run_at
        await fetchWorkflows();
        if (run.status === "success") {
          toast.success("Workflow executed successfully");
        } else {
          toast.error(`Workflow failed: ${run.error || "Unknown error"}`);
        }
      }
      return run;
    },
    [fetchWorkflows]
  );

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleEnabled,
    runManual,
    refetch: fetchWorkflows,
  };
}

export function useWorkflowDetail(workflowId: string | null) {
  const { user, loading: authLoading } = useAuth();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!user || !workflowId) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [wf, wfRuns] = await Promise.all([
        getWorkflowService(workflowId),
        getWorkflowRunsService(workflowId),
      ]);
      if (mountedRef.current) {
        setWorkflow(wf);
        setRuns(wfRuns);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch workflow");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading, workflowId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateWorkflow = useCallback(
    async (input: WorkflowInput) => {
      if (!workflowId) return;
      const updated = await updateWorkflowService(workflowId, input);
      if (mountedRef.current) {
        setWorkflow(updated);
        toast.success("Workflow saved");
      }
      return updated;
    },
    [workflowId]
  );

  const runManual = useCallback(
    async () => {
      if (!workflowId) return;
      const run = await runWorkflowService(workflowId);
      if (mountedRef.current) {
        await fetchDetail();
        if (run.status === "success") {
          toast.success("Workflow executed successfully");
        } else {
          toast.error(`Workflow failed: ${run.error || "Unknown error"}`);
        }
      }
      return run;
    },
    [workflowId, fetchDetail]
  );

  const fetchStepLogs = useCallback(
    async (runId: string): Promise<WorkflowStepLog[]> => {
      if (!workflowId) return [];
      return getStepLogsService(workflowId, runId);
    },
    [workflowId]
  );

  return {
    workflow,
    runs,
    loading,
    error,
    updateWorkflow,
    runManual,
    fetchStepLogs,
    refetch: fetchDetail,
  };
}
