import { api } from "@/lib/api/client";
import type { JsonDocument, JsonDocumentInput } from "@/lib/types/database";

export async function getJsonDocuments(): Promise<JsonDocument[]> {
  return api.get<JsonDocument[]>("/api/json-documents");
}

export async function createJsonDocument(input: JsonDocumentInput): Promise<JsonDocument> {
  return api.post<JsonDocument>("/api/json-documents", input);
}

export async function updateJsonDocument(id: string, input: JsonDocumentInput): Promise<JsonDocument> {
  return api.put<JsonDocument>(`/api/json-documents/${id}`, input);
}

export async function deleteJsonDocument(id: string): Promise<void> {
  await api.delete(`/api/json-documents/${id}`);
}
