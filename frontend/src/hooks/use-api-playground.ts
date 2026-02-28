"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getCollections,
  createCollection as createCollectionService,
  updateCollection as updateCollectionService,
  deleteCollection as deleteCollectionService,
  createRequest as createRequestService,
  updateRequest as updateRequestService,
  deleteRequest as deleteRequestService,
  moveRequest as moveRequestService,
  sendRequest as sendRequestService,
  getHistory,
  deleteHistoryItem as deleteHistoryItemService,
  clearHistory as clearHistoryService,
} from "@/lib/services/api-playground";
import { useAuth } from "@/providers/auth-provider";
import type {
  ApiCollection,
  ApiCollectionInput,
  ApiRequest,
  ApiRequestInput,
  ApiRequestHistory,
  ApiProxyRequest,
  ApiProxyResponse,
} from "@/lib/types/database";

export function useApiPlayground() {
  const { user, loading: authLoading } = useAuth();
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const [uncollected, setUncollected] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeRequest, setActiveRequest] = useState<ApiRequest | null>(null);
  const [response, setResponse] = useState<ApiProxyResponse | null>(null);
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<ApiRequestHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchCollections = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getCollections();
      if (mountedRef.current) {
        setCollections(data.collections);
        setUncollected(data.uncollected);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // --- Collections ---

  const createCollection = useCallback(
    async (input: ApiCollectionInput) => {
      if (!user) return;
      const created = await createCollectionService(input);
      if (mountedRef.current) {
        setCollections((prev) => [created, ...prev]);
        toast.success("Collection created");
      }
      return created;
    },
    [user]
  );

  const updateCollection = useCallback(
    async (id: string, input: ApiCollectionInput) => {
      const updated = await updateCollectionService(id, input);
      if (mountedRef.current) {
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? { ...updated, requests: c.requests } : c))
        );
        toast.success("Collection updated");
      }
      return updated;
    },
    []
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      await deleteCollectionService(id);
      if (mountedRef.current) {
        // Requests in this collection become uncollected
        const col = collections.find((c) => c.id === id);
        if (col) {
          const orphaned = col.requests.map((r) => ({ ...r, collection_id: null }));
          setUncollected((prev) => [...orphaned, ...prev]);
        }
        setCollections((prev) => prev.filter((c) => c.id !== id));
        if (activeRequest?.collection_id === id) {
          setActiveRequest((prev) => prev ? { ...prev, collection_id: null } : null);
        }
        toast.success("Collection deleted");
      }
    },
    [collections, activeRequest]
  );

  // --- Requests ---

  const createRequest = useCallback(
    async (input: ApiRequestInput) => {
      if (!user) return;
      const created = await createRequestService(input);
      if (mountedRef.current) {
        if (created.collection_id) {
          setCollections((prev) =>
            prev.map((c) =>
              c.id === created.collection_id
                ? { ...c, requests: [...c.requests, created] }
                : c
            )
          );
        } else {
          setUncollected((prev) => [...prev, created]);
        }
        setActiveRequest(created);
        toast.success("Request created");
      }
      return created;
    },
    [user]
  );

  const updateActiveRequest = useCallback(
    async (input: ApiRequestInput) => {
      if (!activeRequest) return;
      const updated = await updateRequestService(activeRequest.id, input);
      if (mountedRef.current) {
        setActiveRequest(updated);
        // Update in tree
        const updateInList = (list: ApiRequest[]) =>
          list.map((r) => (r.id === updated.id ? updated : r));
        if (updated.collection_id) {
          setCollections((prev) =>
            prev.map((c) =>
              c.id === updated.collection_id
                ? { ...c, requests: updateInList(c.requests) }
                : c
            )
          );
        } else {
          setUncollected((prev) => updateInList(prev));
        }
      }
      return updated;
    },
    [activeRequest]
  );

  const deleteRequest = useCallback(
    async (id: string) => {
      await deleteRequestService(id);
      if (mountedRef.current) {
        setCollections((prev) =>
          prev.map((c) => ({
            ...c,
            requests: c.requests.filter((r) => r.id !== id),
          }))
        );
        setUncollected((prev) => prev.filter((r) => r.id !== id));
        if (activeRequest?.id === id) {
          setActiveRequest(null);
          setResponse(null);
        }
        toast.success("Request deleted");
      }
    },
    [activeRequest]
  );

  const moveRequestToCollection = useCallback(
    async (requestId: string, collectionId: string | null) => {
      const updated = await moveRequestService(requestId, collectionId);
      if (mountedRef.current) {
        // Remove from old location
        setCollections((prev) =>
          prev.map((c) => ({
            ...c,
            requests: c.requests.filter((r) => r.id !== requestId),
          }))
        );
        setUncollected((prev) => prev.filter((r) => r.id !== requestId));

        // Add to new location
        if (updated.collection_id) {
          setCollections((prev) =>
            prev.map((c) =>
              c.id === updated.collection_id
                ? { ...c, requests: [...c.requests, updated] }
                : c
            )
          );
        } else {
          setUncollected((prev) => [...prev, updated]);
        }

        if (activeRequest?.id === requestId) {
          setActiveRequest(updated);
        }
        toast.success("Request moved");
      }
    },
    [activeRequest]
  );

  // --- Send ---

  const send = useCallback(
    async (proxy: ApiProxyRequest) => {
      setSending(true);
      setResponse(null);
      try {
        const res = await sendRequestService(proxy);
        if (mountedRef.current) {
          setResponse(res);
          // Refresh history after send
          fetchHistory();
        }
        return res;
      } catch (err) {
        if (mountedRef.current) {
          toast.error(err instanceof Error ? err.message : "Request failed");
        }
      } finally {
        if (mountedRef.current) setSending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // --- History ---

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      setHistoryLoading(true);
      const data = await getHistory();
      if (mountedRef.current) {
        setHistory(data);
      }
    } catch {
      // Silently fail for history
    } finally {
      if (mountedRef.current) setHistoryLoading(false);
    }
  }, [user]);

  const deleteHistoryItem = useCallback(
    async (id: string) => {
      await deleteHistoryItemService(id);
      if (mountedRef.current) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
        toast.success("History item deleted");
      }
    },
    []
  );

  const clearAllHistory = useCallback(async () => {
    await clearHistoryService();
    if (mountedRef.current) {
      setHistory([]);
      toast.success("History cleared");
    }
  }, []);

  return {
    // Tree state
    collections,
    uncollected,
    loading,
    error,
    refetch: fetchCollections,

    // Collections
    createCollection,
    updateCollection,
    deleteCollection,

    // Active request
    activeRequest,
    setActiveRequest,

    // Request CRUD
    createRequest,
    updateActiveRequest,
    deleteRequest,
    moveRequestToCollection,

    // Send
    response,
    sending,
    send,
    setResponse,

    // History
    history,
    historyLoading,
    fetchHistory,
    deleteHistoryItem,
    clearAllHistory,
  };
}
