import { api } from "@/lib/api/client";
import type { CodeSnippet, CodeSnippetInput } from "@/lib/types/database";

export async function getMySnippets(): Promise<CodeSnippet[]> {
  return api.get<CodeSnippet[]>("/api/snippets");
}

export async function getSharedSnippets(): Promise<CodeSnippet[]> {
  return api.get<CodeSnippet[]>("/api/snippets/shared");
}

export async function createSnippet(
  input: CodeSnippetInput
): Promise<CodeSnippet> {
  return api.post<CodeSnippet>("/api/snippets", input);
}

export async function updateSnippet(
  snippetId: string,
  input: Partial<CodeSnippetInput>
): Promise<CodeSnippet> {
  return api.put<CodeSnippet>(`/api/snippets/${snippetId}`, input);
}

export async function deleteSnippet(snippetId: string): Promise<void> {
  await api.delete(`/api/snippets/${snippetId}`);
}

export async function copySnippet(snippetId: string): Promise<CodeSnippet> {
  return api.post<CodeSnippet>(`/api/snippets/copy/${snippetId}`);
}
