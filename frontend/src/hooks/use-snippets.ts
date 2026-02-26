"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getMySnippets,
  createSnippet as createSnippetService,
  updateSnippet as updateSnippetService,
  deleteSnippet as deleteSnippetService,
} from "@/lib/services/snippets";
import { useAuth } from "@/providers/auth-provider";
import type { CodeSnippet, CodeSnippetInput } from "@/lib/types/database";

export function useSnippets() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnippets = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMySnippets(supabase, user.id);
      setSnippets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snippets");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const createSnippet = useCallback(
    async (input: CodeSnippetInput) => {
      if (!user) return;
      const created = await createSnippetService(supabase, user.id, input);
      setSnippets((prev) => [created, ...prev]);
      return created;
    },
    [user, supabase]
  );

  const updateSnippet = useCallback(
    async (snippetId: string, input: Partial<CodeSnippetInput>) => {
      const updated = await updateSnippetService(supabase, snippetId, input);
      setSnippets((prev) =>
        prev.map((s) => (s.id === snippetId ? updated : s))
      );
      return updated;
    },
    [supabase]
  );

  const deleteSnippet = useCallback(
    async (snippetId: string) => {
      await deleteSnippetService(supabase, snippetId);
      setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
    },
    [supabase]
  );

  const toggleFavorite = useCallback(
    async (snippet: CodeSnippet) => {
      const newValue = !snippet.is_favorite;
      // Optimistic update
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === snippet.id ? { ...s, is_favorite: newValue } : s
        )
      );
      try {
        await updateSnippetService(supabase, snippet.id, {
          is_favorite: newValue,
        });
      } catch {
        // Revert on error
        setSnippets((prev) =>
          prev.map((s) =>
            s.id === snippet.id ? { ...s, is_favorite: snippet.is_favorite } : s
          )
        );
      }
    },
    [supabase]
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
