"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
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
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchSnippets = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getMySnippets(supabase, user.id);
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
  }, [user, supabase]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const createSnippet = useCallback(
    async (input: CodeSnippetInput) => {
      if (!user) return;
      const created = await createSnippetService(supabase, user.id, input);
      if (mountedRef.current) {
        setSnippets((prev) => [created, ...prev]);
        toast.success("Snippet created");
      }
      return created;
    },
    [user, supabase]
  );

  const updateSnippet = useCallback(
    async (snippetId: string, input: Partial<CodeSnippetInput>) => {
      const updated = await updateSnippetService(supabase, snippetId, input);
      if (mountedRef.current) {
        setSnippets((prev) =>
          prev.map((s) => (s.id === snippetId ? updated : s))
        );
        toast.success("Snippet updated");
      }
      return updated;
    },
    [supabase]
  );

  const deleteSnippet = useCallback(
    async (snippetId: string) => {
      await deleteSnippetService(supabase, snippetId);
      if (mountedRef.current) {
        setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
        toast.success("Snippet deleted");
      }
    },
    [supabase]
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
        await updateSnippetService(supabase, snippet.id, {
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
