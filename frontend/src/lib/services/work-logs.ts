import { api } from "@/lib/api/client";
import type { WorkLog, WorkLogInput } from "@/lib/types/database";

export async function getWorkLogs(): Promise<WorkLog[]> {
  return api.get<WorkLog[]>("/api/work-logs");
}

export async function createWorkLog(input: WorkLogInput): Promise<WorkLog> {
  return api.post<WorkLog>("/api/work-logs", input);
}

export async function updateWorkLog(
  workLogId: string,
  input: Partial<WorkLogInput>
): Promise<WorkLog> {
  return api.put<WorkLog>(`/api/work-logs/${workLogId}`, input);
}

export async function deleteWorkLog(workLogId: string): Promise<void> {
  await api.delete(`/api/work-logs/${workLogId}`);
}
