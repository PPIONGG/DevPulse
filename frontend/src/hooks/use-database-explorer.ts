"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getConnections,
  createConnection as createConnectionService,
  updateConnection as updateConnectionService,
  deleteConnection as deleteConnectionService,
  testConnection as testConnectionService,
  getTables as getTablesService,
  getTableDetail as getTableDetailService,
  executeQuery as executeQueryService,
  getSavedQueries,
  createSavedQuery as createSavedQueryService,
  updateSavedQuery as updateSavedQueryService,
  deleteSavedQuery as deleteSavedQueryService,
  getHistory as getHistoryService,
  clearHistory as clearHistoryService,
} from "@/lib/services/database-explorer";
import { useAuth } from "@/providers/auth-provider";
import type {
  DBConnection,
  DBConnectionInput,
  TableInfo,
  TableDetail,
  QueryRequest,
  QueryResult,
  SavedQuery,
  SavedQueryInput,
  QueryHistoryEntry,
} from "@/lib/types/database";

export function useDatabaseExplorer() {
  const { user, loading: authLoading } = useAuth();
  const [connections, setConnections] = useState<DBConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableDetail, setTableDetail] = useState<TableDetail | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchConnections = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getConnections();
      if (mountedRef.current) {
        setConnections(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch connections");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  const fetchSavedQueries = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSavedQueries();
      if (mountedRef.current) {
        setSavedQueries(data);
      }
    } catch {
      // Non-critical, don't set error
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getHistoryService(50);
      if (mountedRef.current) {
        setHistory(data);
      }
    } catch {
      // Non-critical
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
    fetchSavedQueries();
    fetchHistory();
  }, [fetchConnections, fetchSavedQueries, fetchHistory]);

  // --- Connections ---

  const createConnection = useCallback(
    async (input: DBConnectionInput) => {
      if (!user) return;
      const created = await createConnectionService(input);
      if (mountedRef.current) {
        setConnections((prev) => [created, ...prev]);
        toast.success("Connection created");
      }
      return created;
    },
    [user]
  );

  const updateConnection = useCallback(
    async (id: string, input: DBConnectionInput) => {
      const updated = await updateConnectionService(id, input);
      if (mountedRef.current) {
        setConnections((prev) =>
          prev.map((c) => (c.id === id ? updated : c))
        );
        toast.success("Connection updated");
      }
      return updated;
    },
    []
  );

  const deleteConnection = useCallback(
    async (id: string) => {
      await deleteConnectionService(id);
      if (mountedRef.current) {
        setConnections((prev) => prev.filter((c) => c.id !== id));
        if (activeConnectionId === id) {
          setActiveConnectionId(null);
          setTables([]);
          setTableDetail(null);
        }
        toast.success("Connection deleted");
      }
    },
    [activeConnectionId]
  );

  const testConnection = useCallback(
    async (input: DBConnectionInput) => {
      const result = await testConnectionService(input);
      toast.success(result.message);
      return result;
    },
    []
  );

  // --- Schema ---

  const selectConnection = useCallback(
    async (connId: string | null) => {
      setActiveConnectionId(connId);
      setTables([]);
      setTableDetail(null);
      setQueryResult(null);

      if (!connId) return;

      try {
        setTablesLoading(true);
        const data = await getTablesService(connId);
        if (mountedRef.current) {
          setTables(data);
        }
      } catch (err) {
        if (mountedRef.current) {
          toast.error(err instanceof Error ? err.message : "Failed to fetch tables");
        }
      } finally {
        if (mountedRef.current) setTablesLoading(false);
      }
    },
    []
  );

  const refreshTables = useCallback(async () => {
    if (!activeConnectionId) return;
    try {
      setTablesLoading(true);
      const data = await getTablesService(activeConnectionId);
      if (mountedRef.current) {
        setTables(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        toast.error(err instanceof Error ? err.message : "Failed to refresh tables");
      }
    } finally {
      if (mountedRef.current) setTablesLoading(false);
    }
  }, [activeConnectionId]);

  const fetchTableDetail = useCallback(
    async (tableName: string) => {
      if (!activeConnectionId) return;
      try {
        const data = await getTableDetailService(activeConnectionId, tableName);
        if (mountedRef.current) {
          setTableDetail(data);
        }
      } catch (err) {
        if (mountedRef.current) {
          toast.error(err instanceof Error ? err.message : "Failed to fetch table detail");
        }
      }
    },
    [activeConnectionId]
  );

  // --- Query ---

  const runQuery = useCallback(
    async (query: string, limit?: number) => {
      if (!activeConnectionId || !query.trim()) return;
      try {
        setQueryLoading(true);
        const req: QueryRequest = {
          connection_id: activeConnectionId,
          query: query.trim(),
          limit: limit || 100,
        };
        const result = await executeQueryService(req);
        if (mountedRef.current) {
          setQueryResult(result);
          // Refresh history after running
          fetchHistory();
        }
        return result;
      } catch (err) {
        if (mountedRef.current) {
          const msg = err instanceof Error ? err.message : "Query failed";
          toast.error(msg);
          // Refresh history to show error entry
          fetchHistory();
        }
        throw err;
      } finally {
        if (mountedRef.current) setQueryLoading(false);
      }
    },
    [activeConnectionId, fetchHistory]
  );

  // --- Saved Queries ---

  const createSavedQuery = useCallback(
    async (input: SavedQueryInput) => {
      const created = await createSavedQueryService(input);
      if (mountedRef.current) {
        setSavedQueries((prev) => [created, ...prev]);
        toast.success("Query saved");
      }
      return created;
    },
    []
  );

  const updateSavedQuery = useCallback(
    async (id: string, input: SavedQueryInput) => {
      const updated = await updateSavedQueryService(id, input);
      if (mountedRef.current) {
        setSavedQueries((prev) =>
          prev.map((q) => (q.id === id ? updated : q))
        );
        toast.success("Saved query updated");
      }
      return updated;
    },
    []
  );

  const deleteSavedQuery = useCallback(
    async (id: string) => {
      await deleteSavedQueryService(id);
      if (mountedRef.current) {
        setSavedQueries((prev) => prev.filter((q) => q.id !== id));
        toast.success("Saved query deleted");
      }
    },
    []
  );

  // --- History ---

  const clearHistory = useCallback(async () => {
    await clearHistoryService();
    if (mountedRef.current) {
      setHistory([]);
      toast.success("History cleared");
    }
  }, []);

  const activeConnection = activeConnectionId
    ? connections.find((c) => c.id === activeConnectionId) ?? null
    : null;

  return {
    // Connections
    connections,
    activeConnection,
    activeConnectionId,
    loading,
    error,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    selectConnection,

    // Schema
    tables,
    tablesLoading,
    tableDetail,
    fetchTableDetail,
    refreshTables,

    // Query
    queryResult,
    queryLoading,
    runQuery,

    // Saved queries
    savedQueries,
    createSavedQuery,
    updateSavedQuery,
    deleteSavedQuery,

    // History
    history,
    clearHistory,

    // Refetch
    refetch: fetchConnections,
  };
}
