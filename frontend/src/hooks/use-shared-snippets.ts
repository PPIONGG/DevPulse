"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSharedSnippets } from "@/lib/services/snippets";
import { useAuth } from "@/providers/auth-provider";
import type { CodeSnippet } from "@/lib/types/database";

export function useSharedSnippets() {
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
      const data = await getSharedSnippets();
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
  }, [user, authLoading]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  return { snippets, loading, error, refetch: fetchSnippets };
}
