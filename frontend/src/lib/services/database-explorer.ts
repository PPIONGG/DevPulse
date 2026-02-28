import { api } from "@/lib/api/client";
import type {
  DBConnection,
  DBConnectionInput,
  TableInfo,
  TableDetail,
  QueryRequest,
  QueryResult,
  SavedQuery,
  SavedQueryInput,
  QueryHistoryEntry,
} from "@/lib/types/database";

// --- Connections ---

export async function getConnections(): Promise<DBConnection[]> {
  return api.get<DBConnection[]>("/api/db-explorer/connections");
}

export async function createConnection(input: DBConnectionInput): Promise<DBConnection> {
  return api.post<DBConnection>("/api/db-explorer/connections", input);
}

export async function updateConnection(id: string, input: DBConnectionInput): Promise<DBConnection> {
  return api.put<DBConnection>(`/api/db-explorer/connections/${id}`, input);
}

export async function deleteConnection(id: string): Promise<void> {
  await api.delete(`/api/db-explorer/connections/${id}`);
}

export async function testConnection(input: DBConnectionInput): Promise<{ message: string }> {
  return api.post<{ message: string }>("/api/db-explorer/connections/test", input, 15_000);
}

// --- Schema ---

export async function getTables(connId: string): Promise<TableInfo[]> {
  return api.get<TableInfo[]>(`/api/db-explorer/connections/${connId}/tables`);
}

export async function getTableDetail(connId: string, table: string): Promise<TableDetail> {
  return api.get<TableDetail>(`/api/db-explorer/connections/${connId}/tables/${table}`);
}

// --- Query Execution ---

export async function executeQuery(req: QueryRequest): Promise<QueryResult> {
  return api.post<QueryResult>("/api/db-explorer/query", req, 65_000);
}

// --- Saved Queries ---

export async function getSavedQueries(): Promise<SavedQuery[]> {
  return api.get<SavedQuery[]>("/api/db-explorer/saved-queries");
}

export async function createSavedQuery(input: SavedQueryInput): Promise<SavedQuery> {
  return api.post<SavedQuery>("/api/db-explorer/saved-queries", input);
}

export async function updateSavedQuery(id: string, input: SavedQueryInput): Promise<SavedQuery> {
  return api.put<SavedQuery>(`/api/db-explorer/saved-queries/${id}`, input);
}

export async function deleteSavedQuery(id: string): Promise<void> {
  await api.delete(`/api/db-explorer/saved-queries/${id}`);
}

// --- History ---

export async function getHistory(limit?: number): Promise<QueryHistoryEntry[]> {
  const params = limit ? `?limit=${limit}` : "";
  return api.get<QueryHistoryEntry[]>(`/api/db-explorer/history${params}`);
}

export async function clearHistory(): Promise<void> {
  await api.delete("/api/db-explorer/history");
}
