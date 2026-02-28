"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Clock,
  Pencil,
  Trash2,
  DollarSign,
  Archive,
  Eye,
  Download,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { TimerBar } from "@/components/time-tracker/timer-bar";
import { ClientForm } from "@/components/time-tracker/client-form";
import { ProjectForm } from "@/components/time-tracker/project-form";
import { TimeEntryForm } from "@/components/time-tracker/time-entry-form";
import { TimeReport } from "@/components/time-tracker/time-report";
import { InvoiceForm } from "@/components/time-tracker/invoice-form";
import { InvoicePreview } from "@/components/time-tracker/invoice-preview";
import { TimeTrackerSkeleton } from "@/components/skeletons";
import { useTimeTracker } from "@/hooks/use-time-tracker";
import { getInvoicePdfUrl } from "@/lib/services/time-tracker";
import { useTranslation } from "@/providers/language-provider";
import { toast } from "sonner";
import type {
  Client,
  Project,
  TimeEntry,
  Invoice,
  ClientInput,
  ProjectInput,
  TimeEntryInput,
  InvoiceInput,
} from "@/lib/types/database";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

export default function TimeTrackerPage() {
  const { t } = useTranslation();
  const {
    clients,
    createClient,
    updateClient,
    deleteClient,
    projects,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    runningEntry,
    startTimer,
    stopTimer,
    elapsed,
    entries,
    createEntry,
    updateEntry,
    deleteEntry,
    report,
    reportRange,
    setReportRange,
    fetchReport,
    invoices,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    loading,
    error,
    refetch,
  } = useTimeTracker();

  // Form state
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);

  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Filters
  const [entrySearch, setEntrySearch] = useState("");
  const [entryProjectFilter, setEntryProjectFilter] = useState("all");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");

  // Filter entries
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (entryProjectFilter !== "all") {
      result = result.filter((e) => e.project_id === entryProjectFilter);
    }
    if (entrySearch.trim()) {
      const q = entrySearch.toLowerCase();
      result = result.filter((e) => e.description.toLowerCase().includes(q));
    }
    return result;
  }, [entries, entryProjectFilter, entrySearch]);

  // Today's entries
  const todayEntries = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return entries.filter(
      (e) => e.start_time.slice(0, 10) === today && e.end_time
    );
  }, [entries]);

  const todayTotal = useMemo(
    () => todayEntries.reduce((sum, e) => sum + e.duration, 0),
    [todayEntries]
  );

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    if (invoiceStatusFilter === "all") return invoices;
    return invoices.filter((i) => i.status === invoiceStatusFilter);
  }, [invoices, invoiceStatusFilter]);

  // Project lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Client lookup
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  // Handlers
  const handleCreateClient = async (input: ClientInput) => {
    await createClient(input);
  };
  const handleUpdateClient = async (input: ClientInput) => {
    if (!editingClient) return;
    await updateClient(editingClient.id, input);
    setEditingClient(null);
  };
  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    try {
      await deleteClient(deletingClient.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("timeTracker.deleteClientFailed"));
    } finally {
      setDeletingClient(null);
    }
  };

  const handleCreateProject = async (input: ProjectInput) => {
    await createProject(input);
  };
  const handleUpdateProject = async (input: ProjectInput) => {
    if (!editingProject) return;
    await updateProject(editingProject.id, input);
    setEditingProject(null);
  };
  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    try {
      await deleteProject(deletingProject.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("timeTracker.deleteProjectFailed"));
    } finally {
      setDeletingProject(null);
    }
  };
  const handleArchiveProject = async (id: string) => {
    try {
      await archiveProject(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("timeTracker.archiveProjectFailed"));
    }
  };

  const handleCreateEntry = async (input: TimeEntryInput) => {
    await createEntry(input);
  };
  const handleUpdateEntry = async (input: TimeEntryInput) => {
    if (!editingEntry) return;
    await updateEntry(editingEntry.id, input);
    setEditingEntry(null);
  };
  const handleDeleteEntry = async () => {
    if (!deletingEntry) return;
    try {
      await deleteEntry(deletingEntry.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("timeTracker.deleteEntryFailed"));
    } finally {
      setDeletingEntry(null);
    }
  };

  const handleCreateInvoice = async (input: InvoiceInput) => {
    await createInvoice(input);
  };
  const handleUpdateInvoice = async (input: InvoiceInput) => {
    if (!editingInvoice) return;
    await updateInvoice(editingInvoice.id, input);
    setEditingInvoice(null);
  };
  const handleDeleteInvoice = async () => {
    if (!deletingInvoice) return;
    try {
      await deleteInvoice(deletingInvoice.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("timeTracker.deleteInvoiceFailed"));
    } finally {
      setDeletingInvoice(null);
    }
  };
  const handleInvoiceStatus = async (id: string, status: string) => {
    try {
      await updateInvoiceStatus(id, status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("timeTracker.updateStatusFailed"));
    }
  };

  if (loading) return <TimeTrackerSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("timeTracker.pageTitle")}</h2>
        <p className="mt-1 text-muted-foreground">
          {t("timeTracker.pageSubtitle")}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            {t("timeTracker.tryAgain")}
          </button>
        </div>
      )}

      <TimerBar
        projects={projects}
        runningEntry={runningEntry}
        elapsed={elapsed}
        onStart={startTimer}
        onStop={stopTimer}
      />

      <Tabs defaultValue="timer">
        <TabsList>
          <TabsTrigger value="timer">{t("timeTracker.tabTimer")}</TabsTrigger>
          <TabsTrigger value="entries">{t("timeTracker.tabEntries")}</TabsTrigger>
          <TabsTrigger value="reports">{t("timeTracker.tabReports")}</TabsTrigger>
          <TabsTrigger value="invoices">{t("timeTracker.tabInvoices")}</TabsTrigger>
          <TabsTrigger value="clients">{t("timeTracker.tabClients")}</TabsTrigger>
          <TabsTrigger value="projects">{t("timeTracker.tabProjects")}</TabsTrigger>
        </TabsList>

        {/* ─── Timer Tab ─── */}
        <TabsContent value="timer" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("timeTracker.today")}</h3>
            <span className="text-sm text-muted-foreground">
              {t("timeTracker.total")} {formatDuration(todayTotal)}
            </span>
          </div>
          {todayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">{t("timeTracker.noEntriesToday")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("timeTracker.noEntriesTodayDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayEntries.map((entry) => {
                const project = projectMap.get(entry.project_id);
                return (
                  <Card key={entry.id} className="gap-0 py-0">
                    <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {project && (
                          <span
                            className="inline-block size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {project?.title || t("timeTracker.unknownProject")}
                          </p>
                          {entry.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {entry.is_billable && (
                          <DollarSign className="size-3.5 text-green-500" />
                        )}
                        <span className="font-mono text-sm">
                          {formatDuration(entry.duration)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => {
                            setEditingEntry(entry);
                            setEntryFormOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => {
              setEditingEntry(null);
              setEntryFormOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            {t("timeTracker.addManualEntry")}
          </Button>
        </TabsContent>

        {/* ─── Entries Tab ─── */}
        <TabsContent value="entries" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("timeTracker.searchEntries")}
                className="pl-9"
                value={entrySearch}
                onChange={(e) => setEntrySearch(e.target.value)}
              />
            </div>
            <Select
              value={entryProjectFilter}
              onValueChange={setEntryProjectFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("timeTracker.allProjects")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("timeTracker.allProjects")}</SelectItem>
                {projects
                  .filter((p) => !p.is_archived)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditingEntry(null);
                setEntryFormOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              {t("timeTracker.newEntry")}
            </Button>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">{t("timeTracker.noTimeEntries")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("timeTracker.noTimeEntriesDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => {
                const project = projectMap.get(entry.project_id);
                return (
                  <Card key={entry.id} className="gap-0 py-0">
                    <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {project && (
                          <span
                            className="inline-block size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {project?.title || t("timeTracker.unknownProject")}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {entry.description || t("timeTracker.noDescription")} &middot;{" "}
                            {formatDate(entry.start_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {entry.tags.length > 0 && (
                          <div className="hidden gap-1 sm:flex">
                            {entry.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {entry.is_billable && (
                          <DollarSign className="size-3.5 text-green-500" />
                        )}
                        <span className="font-mono text-sm">
                          {entry.end_time
                            ? formatDuration(entry.duration)
                            : t("timeTracker.running")}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => {
                            setEditingEntry(entry);
                            setEntryFormOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setDeletingEntry(entry)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Reports Tab ─── */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={reportRange.from}
                onChange={(e) =>
                  setReportRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="w-40"
              />
              <span className="text-muted-foreground">{t("timeTracker.to")}</span>
              <Input
                type="date"
                value={reportRange.to}
                onChange={(e) =>
                  setReportRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="w-40"
              />
            </div>
            <Button variant="outline" onClick={fetchReport}>
              {t("timeTracker.refresh")}
            </Button>
          </div>
          <TimeReport report={report} />
        </TabsContent>

        {/* ─── Invoices Tab ─── */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={invoiceStatusFilter}
              onValueChange={setInvoiceStatusFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("timeTracker.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("timeTracker.allStatuses")}</SelectItem>
                <SelectItem value="draft">{t("timeTracker.statusDraft")}</SelectItem>
                <SelectItem value="sent">{t("timeTracker.statusSent")}</SelectItem>
                <SelectItem value="paid">{t("timeTracker.statusPaid")}</SelectItem>
                <SelectItem value="overdue">{t("timeTracker.statusOverdue")}</SelectItem>
                <SelectItem value="cancelled">{t("timeTracker.statusCancelled")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button
              onClick={() => {
                setEditingInvoice(null);
                setInvoiceFormOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              {t("timeTracker.newInvoice")}
            </Button>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">{t("timeTracker.noInvoices")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("timeTracker.noInvoicesDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInvoices.map((inv) => {
                const client = inv.client_id
                  ? clientMap.get(inv.client_id)
                  : null;
                return (
                  <Card key={inv.id} className="gap-0 py-0">
                    <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {inv.invoice_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client?.name || t("timeTracker.noClient")} &middot; {t("timeTracker.due")}{" "}
                            {inv.due_date}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium">
                          {inv.total.toFixed(2)} {inv.currency}
                        </span>
                        <Badge
                          variant="secondary"
                          className={statusColors[inv.status]}
                        >
                          {inv.status}
                        </Badge>
                        <Select
                          value={inv.status}
                          onValueChange={(v) =>
                            handleInvoiceStatus(inv.id, v)
                          }
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">{t("timeTracker.statusDraft")}</SelectItem>
                            <SelectItem value="sent">{t("timeTracker.statusSent")}</SelectItem>
                            <SelectItem value="paid">{t("timeTracker.statusPaid")}</SelectItem>
                            <SelectItem value="overdue">{t("timeTracker.statusOverdue")}</SelectItem>
                            <SelectItem value="cancelled">{t("timeTracker.statusCancelled")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setPreviewInvoice(inv)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <a href={getInvoicePdfUrl(inv.id)} download>
                            <Download className="size-3.5" />
                          </a>
                        </Button>
                        {inv.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                              setEditingInvoice(inv);
                              setInvoiceFormOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setDeletingInvoice(inv)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Clients Tab ─── */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("timeTracker.clients")}</h3>
            <Button
              onClick={() => {
                setEditingClient(null);
                setClientFormOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              {t("timeTracker.newClient")}
            </Button>
          </div>

          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">{t("timeTracker.noClientsYet")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("timeTracker.noClientsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <Card key={client.id} className="gap-0 py-0">
                  <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[client.company, client.email]
                          .filter(Boolean)
                          .join(" · ") || t("timeTracker.noDetails")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {client.hourly_rate > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {client.hourly_rate}/{client.currency}/hr
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setEditingClient(client);
                          setClientFormOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setDeletingClient(client)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Projects Tab ─── */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("timeTracker.projects")}</h3>
            <Button
              onClick={() => {
                setEditingProject(null);
                setProjectFormOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              {t("timeTracker.newProject")}
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">{t("timeTracker.noProjectsYet")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("timeTracker.noProjectsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => {
                const client = project.client_id
                  ? clientMap.get(project.client_id)
                  : null;
                return (
                  <Card
                    key={project.id}
                    className={`gap-0 py-0 ${project.is_archived ? "opacity-60" : ""}`}
                  >
                    <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          className="inline-block size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {project.title}
                            {project.is_archived && (
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs"
                              >
                                {t("timeTracker.archived")}
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client ? client.name : t("timeTracker.noClient")}
                            {project.hourly_rate != null &&
                              ` · $${project.hourly_rate}/hr`}
                            {project.budget_hours != null &&
                              ` · ${project.budget_hours}h ${t("timeTracker.budget")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleArchiveProject(project.id)}
                          title={
                            project.is_archived ? t("timeTracker.unarchive") : t("timeTracker.archive")
                          }
                        >
                          <Archive className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => {
                            setEditingProject(project);
                            setProjectFormOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setDeletingProject(project)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Dialogs ─── */}

      <ClientForm
        open={clientFormOpen}
        onOpenChange={(open) => {
          setClientFormOpen(open);
          if (!open) setEditingClient(null);
        }}
        client={editingClient}
        onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
      />

      <ProjectForm
        open={projectFormOpen}
        onOpenChange={(open) => {
          setProjectFormOpen(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        clients={clients}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
      />

      <TimeEntryForm
        open={entryFormOpen}
        onOpenChange={(open) => {
          setEntryFormOpen(open);
          if (!open) setEditingEntry(null);
        }}
        entry={editingEntry}
        projects={projects}
        onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
      />

      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={(open) => {
          setInvoiceFormOpen(open);
          if (!open) setEditingInvoice(null);
        }}
        invoice={editingInvoice}
        clients={clients}
        onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
      />

      <InvoicePreview
        open={!!previewInvoice}
        onOpenChange={(open) => !open && setPreviewInvoice(null)}
        invoice={previewInvoice}
        clients={clients}
      />

      {/* Delete confirmations */}
      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("timeTracker.deleteClientTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("timeTracker.deleteClientDesc").replace("{name}", deletingClient?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("timeTracker.deleteProjectTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("timeTracker.deleteProjectDesc").replace("{name}", deletingProject?.title ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("timeTracker.deleteEntryTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("timeTracker.deleteEntryDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("timeTracker.deleteInvoiceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("timeTracker.deleteInvoiceDesc").replace("{number}", deletingInvoice?.invoice_number ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
