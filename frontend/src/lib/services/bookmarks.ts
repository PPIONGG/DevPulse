import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bookmark, BookmarkInput } from "@/lib/types/database";

export async function getBookmarks(
  supabase: SupabaseClient,
  userId: string
): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createBookmark(
  supabase: SupabaseClient,
  userId: string,
  input: BookmarkInput
): Promise<Bookmark> {
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBookmark(
  supabase: SupabaseClient,
  bookmarkId: string,
  input: Partial<BookmarkInput>
): Promise<Bookmark> {
  const { data, error } = await supabase
    .from("bookmarks")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", bookmarkId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBookmark(
  supabase: SupabaseClient,
  bookmarkId: string
): Promise<void> {
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId);
  if (error) throw error;
}
