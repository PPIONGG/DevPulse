"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getAdminSnippets, verifySnippet, deleteAdminSnippet } from "@/lib/services/admin";
import type { CodeSnippet } from "@/lib/types/database";

export function useAdminSnippets() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchSnippets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminSnippets();
      if (mountedRef.current) setSnippets(data);
    } catch {
      if (mountedRef.current) toast.error("Failed to load snippets");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSnippets(); }, [fetchSnippets]);

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await verifySnippet(id, verified);
      if (mountedRef.current) {
        setSnippets(prev => prev.map(s => s.id === id ? { ...s, is_verified: verified } : s));
        toast.success(verified ? "Snippet verified" : "Verification removed");
      }
    } catch {
      toast.error("Failed to update verification");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminSnippet(id);
      if (mountedRef.current) {
        setSnippets(prev => prev.filter(s => s.id !== id));
        toast.success("Snippet deleted");
      }
    } catch {
      toast.error("Failed to delete snippet");
    }
  };

  return {
    snippets,
    loading,
    refetch: fetchSnippets,
    verify: handleVerify,
    deleteSnippet: handleDelete,
  };
}
