"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getArticles,
  createArticle as createArticleService,
  updateArticle as updateArticleService,
  deleteArticle as deleteArticleService,
} from "@/lib/services/articles";
import { useAuth } from "@/providers/auth-provider";
import type { Article, ArticleInput } from "@/lib/types/database";

export function useArticles() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getArticles(supabase, user.id);
      setArticles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = useCallback(
    async (input: ArticleInput) => {
      if (!user) return;
      const created = await createArticleService(supabase, user.id, input);
      setArticles((prev) => [created, ...prev]);
      return created;
    },
    [user, supabase]
  );

  const updateArticle = useCallback(
    async (articleId: string, input: Partial<ArticleInput>) => {
      const updated = await updateArticleService(supabase, articleId, input);
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? updated : a))
      );
      return updated;
    },
    [supabase]
  );

  const deleteArticle = useCallback(
    async (articleId: string) => {
      await deleteArticleService(supabase, articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    },
    [supabase]
  );

  const toggleFavorite = useCallback(
    async (article: Article) => {
      const newValue = !article.is_favorite;
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, is_favorite: newValue } : a
        )
      );
      try {
        await updateArticleService(supabase, article.id, {
          is_favorite: newValue,
        });
      } catch {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === article.id ? { ...a, is_favorite: article.is_favorite } : a
          )
        );
      }
    },
    [supabase]
  );

  return {
    articles,
    loading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleFavorite,
    refetch: fetchArticles,
  };
}
