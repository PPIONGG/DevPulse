import { api } from "@/lib/api/client";
import type {
  Client,
  ClientInput,
  Project,
  ProjectInput,
  TimeEntry,
  TimeEntryInput,
  Invoice,
  InvoiceInput,
  TimeReport,
} from "@/lib/types/database";

// Clients
export async function getClients(): Promise<Client[]> {
  return api.get<Client[]>("/api/clients");
}

export async function createClient(input: ClientInput): Promise<Client> {
  return api.post<Client>("/api/clients", input);
}

export async function updateClient(id: string, input: ClientInput): Promise<Client> {
  return api.put<Client>(`/api/clients/${id}`, input);
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/api/clients/${id}`);
}

// Projects
export async function getProjects(all?: boolean): Promise<Project[]> {
  const query = all ? "?all=true" : "";
  return api.get<Project[]>(`/api/projects${query}`);
}

export async function createProject(input: ProjectInput): Promise<Project> {
  return api.post<Project>("/api/projects", input);
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project> {
  return api.put<Project>(`/api/projects/${id}`, input);
}

export async function archiveProject(id: string): Promise<void> {
  await api.patch(`/api/projects/${id}/archive`);
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/api/projects/${id}`);
}

// Time entries
export async function getTimeEntries(params?: {
  project_id?: string;
  from?: string;
  to?: string;
}): Promise<TimeEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.project_id) searchParams.set("project_id", params.project_id);
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  const query = searchParams.toString();
  return api.get<TimeEntry[]>(`/api/time-entries${query ? `?${query}` : ""}`);
}

export async function getRunningEntry(): Promise<TimeEntry | null> {
  return api.get<TimeEntry | null>("/api/time-entries/running");
}

export async function startTimer(input: {
  project_id: string;
  description: string;
}): Promise<TimeEntry> {
  return api.post<TimeEntry>("/api/time-entries/start", input);
}

export async function stopTimer(id: string): Promise<TimeEntry> {
  return api.post<TimeEntry>(`/api/time-entries/${id}/stop`, {});
}

export async function createEntry(input: TimeEntryInput): Promise<TimeEntry> {
  return api.post<TimeEntry>("/api/time-entries", input);
}

export async function updateEntry(id: string, input: TimeEntryInput): Promise<TimeEntry> {
  return api.put<TimeEntry>(`/api/time-entries/${id}`, input);
}

export async function deleteEntry(id: string): Promise<void> {
  await api.delete(`/api/time-entries/${id}`);
}

// Reports
export async function getTimeReport(from: string, to: string): Promise<TimeReport> {
  return api.get<TimeReport>(`/api/time-entries/report?from=${from}&to=${to}`);
}

// Invoices
export async function getInvoices(): Promise<Invoice[]> {
  return api.get<Invoice[]>("/api/invoices");
}

export async function getInvoice(id: string): Promise<Invoice> {
  return api.get<Invoice>(`/api/invoices/${id}`);
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice> {
  return api.post<Invoice>("/api/invoices", input);
}

export async function updateInvoice(id: string, input: InvoiceInput): Promise<Invoice> {
  return api.put<Invoice>(`/api/invoices/${id}`, input);
}

export async function updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
  return api.patch<Invoice>(`/api/invoices/${id}/status`, { status });
}

export async function deleteInvoice(id: string): Promise<void> {
  await api.delete(`/api/invoices/${id}`);
}

export function getInvoicePdfUrl(id: string): string {
  return `/api/invoices/${id}/pdf`;
}
