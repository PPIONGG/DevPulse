"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getArticles,
  createArticle as createArticleService,
  updateArticle as updateArticleService,
  deleteArticle as deleteArticleService,
} from "@/lib/services/articles";
import { useAuth } from "@/providers/auth-provider";
import type { Article, ArticleInput } from "@/lib/types/database";

export function useArticles() {
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchArticles = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getArticles();
      if (mountedRef.current) {
        setArticles(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch articles");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = useCallback(
    async (input: ArticleInput) => {
      if (!user) return;
      const created = await createArticleService(input);
      if (mountedRef.current) {
        setArticles((prev) => [created, ...prev]);
        toast.success("Article created");
      }
      return created;
    },
    [user]
  );

  const updateArticle = useCallback(
    async (articleId: string, input: Partial<ArticleInput>) => {
      const updated = await updateArticleService(articleId, input);
      if (mountedRef.current) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? updated : a))
        );
        toast.success("Article updated");
      }
      return updated;
    },
    []
  );

  const deleteArticle = useCallback(
    async (articleId: string) => {
      await deleteArticleService(articleId);
      if (mountedRef.current) {
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
        toast.success("Article deleted");
      }
    },
    []
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
        await updateArticleService(article.id, {
          is_favorite: newValue,
        });
      } catch {
        if (mountedRef.current) {
          setArticles((prev) =>
            prev.map((a) =>
              a.id === article.id ? { ...a, is_favorite: article.is_favorite } : a
            )
          );
          toast.error("Failed to update favorite");
        }
      }
    },
    []
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
