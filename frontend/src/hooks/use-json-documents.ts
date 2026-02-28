"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getJsonDocuments,
  createJsonDocument as createJsonDocumentService,
  updateJsonDocument as updateJsonDocumentService,
  deleteJsonDocument as deleteJsonDocumentService,
} from "@/lib/services/json-documents";
import { useAuth } from "@/providers/auth-provider";
import type { JsonDocument, JsonDocumentInput } from "@/lib/types/database";

export function useJsonDocuments() {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<JsonDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getJsonDocuments();
      if (mountedRef.current) {
        setDocuments(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch documents");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = useCallback(
    async (input: JsonDocumentInput) => {
      if (!user) return;
      const created = await createJsonDocumentService(input);
      if (mountedRef.current) {
        setDocuments((prev) => [created, ...prev]);
        toast.success("Document saved");
      }
      return created;
    },
    [user]
  );

  const updateDocument = useCallback(
    async (docId: string, input: JsonDocumentInput) => {
      const updated = await updateJsonDocumentService(docId, input);
      if (mountedRef.current) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? updated : d))
        );
        toast.success("Document updated");
      }
      return updated;
    },
    []
  );

  const deleteDocument = useCallback(
    async (docId: string) => {
      await deleteJsonDocumentService(docId);
      if (mountedRef.current) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        toast.success("Document deleted");
      }
    },
    []
  );

  const toggleFavorite = useCallback(
    async (doc: JsonDocument) => {
      const newValue = !doc.is_favorite;
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, is_favorite: newValue } : d
        )
      );
      try {
        await updateJsonDocumentService(doc.id, {
          title: doc.title,
          content: doc.content,
          format: doc.format,
          description: doc.description,
          tags: doc.tags,
          is_favorite: newValue,
        });
      } catch {
        if (mountedRef.current) {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === doc.id ? { ...d, is_favorite: doc.is_favorite } : d
            )
          );
          toast.error("Failed to update favorite");
        }
      }
    },
    []
  );

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite,
    refetch: fetchDocuments,
  };
}
