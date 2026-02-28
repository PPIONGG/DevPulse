"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Database,
  Search,
  History,
  Bookmark,
  Star,
  Trash2,
  Clock,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionForm } from "@/components/connection-form";
import { SavedQueryForm } from "@/components/saved-query-form";
import { SchemaTree } from "@/components/schema-tree";
import { QueryEditor } from "@/components/query-editor";
import { ResultsTable } from "@/components/results-table";
import { useDatabaseExplorer } from "@/hooks/use-database-explorer";
import { isDangerousQuery } from "@/config/database-explorer";
import { useTranslation } from "@/providers/language-provider";
import { toast } from "sonner";
import type {
  DBConnection,
  DBConnectionInput,
  SavedQuery,
  SavedQueryInput,
} from "@/lib/types/database";

export default function DatabaseExplorerPage() {
  const { t } = useTranslation();
  const {
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
    tables,
    tablesLoading,
    tableDetail,
    fetchTableDetail,
    refreshTables,
    queryResult,
    queryLoading,
    runQuery,
    savedQueries,
    createSavedQuery,
    updateSavedQuery,
    deleteSavedQuery,
    history,
    clearHistory,
    refetch,
  } = useDatabaseExplorer();

  // State for forms and dialogs
  const [connFormOpen, setConnFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DBConnection | null>(null);
  const [deletingConnection, setDeletingConnection] = useState<DBConnection | null>(null);
  const [savedQueryFormOpen, setSavedQueryFormOpen] = useState(false);
  const [editingSavedQuery, setEditingSavedQuery] = useState<SavedQuery | null>(null);
  const [deletingSavedQuery, setDeletingSavedQuery] = useState<SavedQuery | null>(null);
  const [clearHistoryConfirm, setClearHistoryConfirm] = useState(false);
  const [dangerousQueryConfirm, setDangerousQueryConfirm] = useState(false);

  // Query state
  const [query, setQuery] = useState("");
  const [sidebarTab, setSidebarTab] = useState("schema");
  const [sidebarSearch, setSidebarSearch] = useState("");

  // Filtered sidebar items
  const filteredSavedQueries = useMemo(() => {
    if (!sidebarSearch.trim()) return savedQueries;
    const q = sidebarSearch.toLowerCase();
    return savedQueries.filter(
      (sq) =>
        sq.title.toLowerCase().includes(q) ||
        sq.query.toLowerCase().includes(q) ||
        sq.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [savedQueries, sidebarSearch]);

  const filteredHistory = useMemo(() => {
    if (!sidebarSearch.trim()) return history;
    const q = sidebarSearch.toLowerCase();
    return history.filter((h) => h.query.toLowerCase().includes(q));
  }, [history, sidebarSearch]);

  // Handlers
  const handleConnFormOpenChange = (open: boolean) => {
    setConnFormOpen(open);
    if (!open) setEditingConnection(null);
  };

  const handleCreateConnection = async (input: DBConnectionInput) => {
    await createConnection(input);
  };

  const handleUpdateConnection = async (input: DBConnectionInput) => {
    if (!editingConnection) return;
    await updateConnection(editingConnection.id, input);
  };

  const handleDeleteConnection = async () => {
    if (!deletingConnection) return;
    try {
      await deleteConnection(deletingConnection.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dbExplorer.deleteConnectionFailed"));
    } finally {
      setDeletingConnection(null);
    }
  };

  const handleEditConnection = (conn: DBConnection) => {
    setEditingConnection(conn);
    setConnFormOpen(true);
  };

  const handleRunQuery = () => {
    if (!query.trim() || !activeConnectionId) return;
    if (isDangerousQuery(query)) {
      setDangerousQueryConfirm(true);
      return;
    }
    runQuery(query);
  };

  const handleConfirmDangerousQuery = () => {
    setDangerousQueryConfirm(false);
    runQuery(query);
  };

  const handleSaveQuery = () => {
    if (!query.trim()) return;
    setEditingSavedQuery(null);
    setSavedQueryFormOpen(true);
  };

  const handleSavedQueryFormOpenChange = (open: boolean) => {
    setSavedQueryFormOpen(open);
    if (!open) setEditingSavedQuery(null);
  };

  const handleCreateSavedQuery = async (input: SavedQueryInput) => {
    await createSavedQuery(input);
  };

  const handleUpdateSavedQuery = async (input: SavedQueryInput) => {
    if (!editingSavedQuery) return;
    await updateSavedQuery(editingSavedQuery.id, input);
  };

  const handleDeleteSavedQuery = async () => {
    if (!deletingSavedQuery) return;
    try {
      await deleteSavedQuery(deletingSavedQuery.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dbExplorer.deleteSavedQueryFailed"));
    } finally {
      setDeletingSavedQuery(null);
    }
  };

  const handleLoadSavedQuery = (sq: SavedQuery) => {
    setQuery(sq.query);
  };

  const handleLoadHistoryQuery = (q: string) => {
    setQuery(q);
  };

  const handleInsertTable = (tableName: string) => {
    setQuery((prev) => {
      if (!prev.trim()) return `SELECT * FROM ${tableName} LIMIT 100`;
      return prev + ` ${tableName}`;
    });
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dbExplorer.clearHistoryFailed"));
    } finally {
      setClearHistoryConfirm(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("dbExplorer.title")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("dbExplorer.subtitle")}
          </p>
        </div>
        <Button onClick={() => setConnFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t("dbExplorer.newConnection")}
        </Button>
      </div>

      {error && (
        <div className="shrink-0 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 gap-4">
          <div className="w-72 space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="flex-1 space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Left sidebar */}
          <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border bg-card">
            {/* Connection selector */}
            <div className="border-b p-3">
              <Select
                value={activeConnectionId || "none"}
                onValueChange={(v) => selectConnection(v === "none" ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    {activeConnection ? (
                      <>
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: activeConnection.color }}
                        />
                        <SelectValue />
                      </>
                    ) : (
                      <SelectValue placeholder={t("dbExplorer.selectConnection")} />
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("dbExplorer.noConnection")}</SelectItem>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: conn.color }}
                        />
                        {conn.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {connections.length > 0 && activeConnection && (
                <div className="mt-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => handleEditConnection(activeConnection)}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 flex-1 text-xs text-destructive"
                    onClick={() => setDeletingConnection(activeConnection)}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar tabs */}
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex min-h-0 flex-1 flex-col">
              <TabsList className="grid w-full shrink-0 grid-cols-3 rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="schema"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <Database className="mr-1 size-3.5" />
                  {t("dbExplorer.tabSchema")}
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <Bookmark className="mr-1 size-3.5" />
                  {t("dbExplorer.tabSaved")}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <History className="mr-1 size-3.5" />
                  {t("dbExplorer.tabHistory")}
                </TabsTrigger>
              </TabsList>

              {sidebarTab !== "schema" && (
                <div className="shrink-0 border-b px-3 py-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t("dbExplorer.searchPlaceholder")}
                      className="h-7 pl-7 text-xs"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto">
                <TabsContent value="schema" className="m-0 p-3">
                  {activeConnectionId ? (
                    <SchemaTree
                      tables={tables}
                      loading={tablesLoading}
                      tableDetail={tableDetail}
                      onSelectTable={fetchTableDetail}
                      onInsertTable={handleInsertTable}
                      onRefresh={refreshTables}
                    />
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {t("dbExplorer.selectConnectionToView")}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="saved" className="m-0 p-2">
                  {filteredSavedQueries.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {sidebarSearch.trim() ? t("dbExplorer.noMatchingQueries") : t("dbExplorer.noSavedQueries")}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredSavedQueries.map((sq) => (
                        <div
                          key={sq.id}
                          className="group cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50"
                          onClick={() => handleLoadSavedQuery(sq)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              {sq.is_favorite && (
                                <Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
                              )}
                              <span className="truncate text-sm font-medium">
                                {sq.title}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSavedQuery(sq);
                                  setSavedQueryFormOpen(true);
                                }}
                              >
                                <ChevronDown className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingSavedQuery(sq);
                                }}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                            {sq.query}
                          </p>
                          {sq.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {sq.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="px-1 py-0 text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="m-0 p-2">
                  {filteredHistory.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {sidebarSearch.trim() ? t("dbExplorer.noMatchingHistory") : t("dbExplorer.noQueryHistory")}
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-destructive"
                          onClick={() => setClearHistoryConfirm(true)}
                        >
                          {t("dbExplorer.clearAll")}
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {filteredHistory.map((entry) => (
                          <div
                            key={entry.id}
                            className="cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50"
                            onClick={() => handleLoadHistoryQuery(entry.query)}
                          >
                            <div className="flex items-center gap-1.5">
                              {entry.status === "error" ? (
                                <AlertTriangle className="size-3 shrink-0 text-destructive" />
                              ) : (
                                <Clock className="size-3 shrink-0 text-muted-foreground" />
                              )}
                              <span className="truncate font-mono text-xs">
                                {entry.query}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 pl-[18px] text-[10px] text-muted-foreground">
                              <span>
                                {new Date(entry.created_at).toLocaleString()}
                              </span>
                              {entry.execution_time_ms != null && (
                                <span>{entry.execution_time_ms}ms</span>
                              )}
                              {entry.row_count != null && (
                                <span>{entry.row_count} {t("dbExplorer.rows")}</span>
                              )}
                            </div>
                            {entry.error_message && (
                              <p className="mt-0.5 truncate pl-[18px] text-[10px] text-destructive">
                                {entry.error_message}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right panel */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Query editor */}
            <div className="shrink-0 overflow-hidden rounded-lg border bg-card" style={{ minHeight: "180px" }}>
              <QueryEditor
                query={query}
                onQueryChange={setQuery}
                onRun={handleRunQuery}
                onSave={handleSaveQuery}
                onClear={() => setQuery("")}
                loading={queryLoading}
                result={queryResult}
                isReadOnly={activeConnection?.is_read_only ?? false}
              />
            </div>

            {/* Results table */}
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
              <ResultsTable result={queryResult} />
            </div>
          </div>
        </div>
      )}

      {/* Connection form */}
      <ConnectionForm
        open={connFormOpen}
        onOpenChange={handleConnFormOpenChange}
        connection={editingConnection}
        onSubmit={editingConnection ? handleUpdateConnection : handleCreateConnection}
        onTestConnection={testConnection}
      />

      {/* Saved query form */}
      <SavedQueryForm
        open={savedQueryFormOpen}
        onOpenChange={handleSavedQueryFormOpenChange}
        savedQuery={editingSavedQuery}
        initialQuery={query}
        connectionId={activeConnectionId}
        onSubmit={editingSavedQuery ? handleUpdateSavedQuery : handleCreateSavedQuery}
      />

      {/* Delete connection confirmation */}
      <AlertDialog
        open={!!deletingConnection}
        onOpenChange={(open) => !open && setDeletingConnection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dbExplorer.deleteConnectionTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dbExplorer.deleteConnectionDesc").replace("{name}", deletingConnection?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConnection}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete saved query confirmation */}
      <AlertDialog
        open={!!deletingSavedQuery}
        onOpenChange={(open) => !open && setDeletingSavedQuery(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dbExplorer.deleteSavedQueryTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dbExplorer.deleteSavedQueryDesc").replace("{name}", deletingSavedQuery?.title ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSavedQuery}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear history confirmation */}
      <AlertDialog
        open={clearHistoryConfirm}
        onOpenChange={setClearHistoryConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dbExplorer.clearHistoryTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dbExplorer.clearHistoryDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory}>{t("dbExplorer.clearAction")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dangerous query confirmation */}
      <AlertDialog
        open={dangerousQueryConfirm}
        onOpenChange={setDangerousQueryConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                {t("dbExplorer.dangerousQueryTitle")}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dbExplorer.dangerousQueryDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDangerousQuery}>
              {t("dbExplorer.executeAnyway")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
