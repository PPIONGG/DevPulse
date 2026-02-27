"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getMySnippets,
  createSnippet as createSnippetService,
  updateSnippet as updateSnippetService,
  deleteSnippet as deleteSnippetService,
} from "@/lib/services/snippets";
import { useAuth } from "@/providers/auth-provider";
import type { CodeSnippet, CodeSnippetInput } from "@/lib/types/database";

export function useSnippets() {
  const { user, loading: authLoading } = useAuth();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchSnippets = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getMySnippets();
      if (mountedRef.current) {
        setSnippets(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch snippets");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const createSnippet = useCallback(
    async (input: CodeSnippetInput) => {
      if (!user) return;
      const created = await createSnippetService(input);
      if (mountedRef.current) {
        setSnippets((prev) => [created, ...prev]);
        toast.success("Snippet created");
      }
      return created;
    },
    [user]
  );

  const updateSnippet = useCallback(
    async (snippetId: string, input: Partial<CodeSnippetInput>) => {
      const updated = await updateSnippetService(snippetId, input);
      if (mountedRef.current) {
        setSnippets((prev) =>
          prev.map((s) => (s.id === snippetId ? updated : s))
        );
        toast.success("Snippet updated");
      }
      return updated;
    },
    []
  );

  const deleteSnippet = useCallback(
    async (snippetId: string) => {
      await deleteSnippetService(snippetId);
      if (mountedRef.current) {
        setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
        toast.success("Snippet deleted");
      }
    },
    []
  );

  const toggleFavorite = useCallback(
    async (snippet: CodeSnippet) => {
      const newValue = !snippet.is_favorite;
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === snippet.id ? { ...s, is_favorite: newValue } : s
        )
      );
      try {
        await updateSnippetService(snippet.id, {
          title: snippet.title,
          code: snippet.code,
          language: snippet.language,
          description: snippet.description,
          tags: snippet.tags,
          is_public: snippet.is_public,
          is_favorite: newValue,
        });
      } catch {
        if (mountedRef.current) {
          setSnippets((prev) =>
            prev.map((s) =>
              s.id === snippet.id ? { ...s, is_favorite: snippet.is_favorite } : s
            )
          );
          toast.error("Failed to update favorite");
        }
      }
    },
    []
  );

  return {
    snippets,
    loading,
    error,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleFavorite,
    refetch: fetchSnippets,
  };
}
