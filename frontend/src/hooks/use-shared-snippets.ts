"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSharedSnippets } from "@/lib/services/snippets";
import { useAuth } from "@/providers/auth-provider";
import type { CodeSnippet } from "@/lib/types/database";

export function useSharedSnippets() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnippets = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSharedSnippets(supabase, user.id);
      setSnippets(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch shared snippets"
      );
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  return { snippets, loading, error, refetch: fetchSnippets };
}
