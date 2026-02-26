import type { SupabaseClient } from "@supabase/supabase-js";
import type { CodeSnippet, CodeSnippetInput } from "@/lib/types/database";

export async function getMySnippets(
  supabase: SupabaseClient,
  userId: string
): Promise<CodeSnippet[]> {
  const { data, error } = await supabase
    .from("snippets")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSharedSnippets(
  supabase: SupabaseClient,
  userId: string
): Promise<CodeSnippet[]> {
  const { data, error } = await supabase
    .from("snippets")
    .select("*")
    .eq("is_public", true)
    .neq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSnippet(
  supabase: SupabaseClient,
  userId: string,
  input: CodeSnippetInput
): Promise<CodeSnippet> {
  const { data, error } = await supabase
    .from("snippets")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSnippet(
  supabase: SupabaseClient,
  snippetId: string,
  input: Partial<CodeSnippetInput>
): Promise<CodeSnippet> {
  const { data, error } = await supabase
    .from("snippets")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", snippetId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSnippet(
  supabase: SupabaseClient,
  snippetId: string
): Promise<void> {
  const { error } = await supabase
    .from("snippets")
    .delete()
    .eq("id", snippetId);
  if (error) throw error;
}
