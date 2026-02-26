"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
      const data = await getSharedSnippets(supabase, user.id);
      if (mountedRef.current) {
        setSnippets(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch shared snippets"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  return { snippets, loading, error, refetch: fetchSnippets };
}
