import { api } from "@/lib/api/client";
import type {
  Workflow,
  WorkflowInput,
  WorkflowRun,
  WorkflowStepLog,
} from "@/lib/types/database";

export async function getWorkflows(): Promise<Workflow[]> {
  return api.get<Workflow[]>("/api/workflows");
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return api.get<Workflow>(`/api/workflows/${id}`);
}

export async function createWorkflow(input: WorkflowInput): Promise<Workflow> {
  return api.post<Workflow>("/api/workflows", input);
}

export async function updateWorkflow(id: string, input: WorkflowInput): Promise<Workflow> {
  return api.put<Workflow>(`/api/workflows/${id}`, input);
}

export async function deleteWorkflow(id: string): Promise<void> {
  await api.delete(`/api/workflows/${id}`);
}

export async function toggleWorkflow(id: string): Promise<Workflow> {
  return api.patch<Workflow>(`/api/workflows/${id}/toggle`);
}

export async function runWorkflow(id: string): Promise<WorkflowRun> {
  return api.post<WorkflowRun>(`/api/workflows/${id}/run`);
}

export async function getWorkflowRuns(workflowId: string): Promise<WorkflowRun[]> {
  return api.get<WorkflowRun[]>(`/api/workflows/${workflowId}/runs`);
}

export async function getWorkflowRun(workflowId: string, runId: string): Promise<WorkflowRun> {
  return api.get<WorkflowRun>(`/api/workflows/${workflowId}/runs/${runId}`);
}

export async function getStepLogs(workflowId: string, runId: string): Promise<WorkflowStepLog[]> {
  return api.get<WorkflowStepLog[]>(`/api/workflows/${workflowId}/runs/${runId}/steps`);
}
