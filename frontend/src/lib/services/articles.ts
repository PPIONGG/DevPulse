import type { SupabaseClient } from "@supabase/supabase-js";
import type { Article, ArticleInput } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getArticles(
  supabase: SupabaseClient,
  userId: string
): Promise<Article[]> {
  const { data, error } = await withTimeout(
    supabase
      .from("articles")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
  );
  if (error) throw error;
  return data ?? [];
}

export async function createArticle(
  supabase: SupabaseClient,
  userId: string,
  input: ArticleInput
): Promise<Article> {
  const { data, error } = await withTimeout(
    supabase
      .from("articles")
      .insert({ ...input, user_id: userId })
      .select()
      .single()
  );
  if (error) throw error;
  return data;
}

export async function updateArticle(
  supabase: SupabaseClient,
  articleId: string,
  input: Partial<ArticleInput>
): Promise<Article> {
  const { data, error } = await withTimeout(
    supabase
      .from("articles")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", articleId)
      .select()
      .single()
  );
  if (error) throw error;
  return data;
}

export async function deleteArticle(
  supabase: SupabaseClient,
  articleId: string
): Promise<void> {
  const { error } = await withTimeout(
    supabase.from("articles").delete().eq("id", articleId)
  );
  if (error) throw error;
}
