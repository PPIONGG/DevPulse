import { api } from "@/lib/api/client";
import type {
  ApiCollection,
  ApiCollectionInput,
  ApiRequest,
  ApiRequestInput,
  ApiRequestHistory,
  ApiProxyRequest,
  ApiProxyResponse,
} from "@/lib/types/database";

// --- Collections ---

export async function getCollections(): Promise<{
  collections: ApiCollection[];
  uncollected: ApiRequest[];
}> {
  return api.get("/api/api-playground/collections");
}

export async function createCollection(input: ApiCollectionInput): Promise<ApiCollection> {
  return api.post<ApiCollection>("/api/api-playground/collections", input);
}

export async function updateCollection(id: string, input: ApiCollectionInput): Promise<ApiCollection> {
  return api.put<ApiCollection>(`/api/api-playground/collections/${id}`, input);
}

export async function deleteCollection(id: string): Promise<void> {
  await api.delete(`/api/api-playground/collections/${id}`);
}

// --- Requests ---

export async function getRequest(id: string): Promise<ApiRequest> {
  return api.get<ApiRequest>(`/api/api-playground/requests/${id}`);
}

export async function createRequest(input: ApiRequestInput): Promise<ApiRequest> {
  return api.post<ApiRequest>("/api/api-playground/requests", input);
}

export async function updateRequest(id: string, input: ApiRequestInput): Promise<ApiRequest> {
  return api.put<ApiRequest>(`/api/api-playground/requests/${id}`, input);
}

export async function deleteRequest(id: string): Promise<void> {
  await api.delete(`/api/api-playground/requests/${id}`);
}

export async function moveRequest(id: string, collectionId: string | null): Promise<ApiRequest> {
  return api.patch<ApiRequest>(`/api/api-playground/requests/${id}/move`, {
    collection_id: collectionId,
  });
}

// --- Send ---

export async function sendRequest(input: ApiProxyRequest): Promise<ApiProxyResponse> {
  return api.post<ApiProxyResponse>("/api/api-playground/send", input, 65_000);
}

// --- History ---

export async function getHistory(limit = 50): Promise<ApiRequestHistory[]> {
  return api.get<ApiRequestHistory[]>(`/api/api-playground/history?limit=${limit}`);
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await api.delete(`/api/api-playground/history/${id}`);
}

export async function clearHistory(): Promise<void> {
  await api.delete("/api/api-playground/history");
}
