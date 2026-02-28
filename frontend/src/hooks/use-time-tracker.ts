"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getClients,
  createClient as createClientService,
  updateClient as updateClientService,
  deleteClient as deleteClientService,
  getProjects,
  createProject as createProjectService,
  updateProject as updateProjectService,
  archiveProject as archiveProjectService,
  deleteProject as deleteProjectService,
  getTimeEntries,
  getRunningEntry,
  startTimer as startTimerService,
  stopTimer as stopTimerService,
  createEntry as createEntryService,
  updateEntry as updateEntryService,
  deleteEntry as deleteEntryService,
  getTimeReport,
  getInvoices,
  createInvoice as createInvoiceService,
  updateInvoice as updateInvoiceService,
  updateInvoiceStatus as updateInvoiceStatusService,
  deleteInvoice as deleteInvoiceService,
} from "@/lib/services/time-tracker";
import { useAuth } from "@/providers/auth-provider";
import type {
  Client,
  ClientInput,
  Project,
  ProjectInput,
  TimeEntry,
  TimeEntryInput,
  Invoice,
  InvoiceInput,
  TimeReport,
} from "@/lib/types/database";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: fmt(monday), to: fmt(sunday) };
}

export function useTimeTracker() {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [report, setReport] = useState<TimeReport | null>(null);
  const [reportRange, setReportRange] = useState(getWeekRange);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Live timer
  useEffect(() => {
    if (!runningEntry) {
      setElapsed(0);
      return;
    }
    const update = () => {
      setElapsed(
        Math.floor((Date.now() - new Date(runningEntry.start_time).getTime()) / 1000)
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [runningEntry]);

  const fetchAll = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [clientsData, projectsData, entriesData, running, invoicesData] =
        await Promise.all([
          getClients(),
          getProjects(true),
          getTimeEntries(),
          getRunningEntry(),
          getInvoices(),
        ]);
      if (mountedRef.current) {
        setClients(clientsData);
        setProjects(projectsData);
        setEntries(entriesData);
        setRunningEntry(running);
        setInvoices(invoicesData);
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
    fetchAll();
  }, [fetchAll]);

  // Fetch report when range changes
  const fetchReport = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getTimeReport(reportRange.from, reportRange.to);
      if (mountedRef.current) setReport(data);
    } catch {
      // Report fetch failure is non-critical
    }
  }, [user, reportRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ─── Clients ───

  const createClient = useCallback(
    async (input: ClientInput) => {
      if (!user) return;
      const created = await createClientService(input);
      if (mountedRef.current) {
        setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Client created");
      }
      return created;
    },
    [user]
  );

  const updateClient = useCallback(
    async (id: string, input: ClientInput) => {
      const updated = await updateClientService(id, input);
      if (mountedRef.current) {
        setClients((prev) =>
          prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success("Client updated");
      }
      return updated;
    },
    []
  );

  const deleteClient = useCallback(async (id: string) => {
    await deleteClientService(id);
    if (mountedRef.current) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Client deleted");
    }
  }, []);

  // ─── Projects ───

  const createProject = useCallback(
    async (input: ProjectInput) => {
      if (!user) return;
      const created = await createProjectService(input);
      if (mountedRef.current) {
        setProjects((prev) => [created, ...prev]);
        toast.success("Project created");
      }
      return created;
    },
    [user]
  );

  const updateProject = useCallback(
    async (id: string, input: ProjectInput) => {
      const updated = await updateProjectService(id, input);
      if (mountedRef.current) {
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
        toast.success("Project updated");
      }
      return updated;
    },
    []
  );

  const archiveProject = useCallback(async (id: string) => {
    await archiveProjectService(id);
    if (mountedRef.current) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_archived: !p.is_archived } : p))
      );
      toast.success("Project archive toggled");
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await deleteProjectService(id);
    if (mountedRef.current) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    }
  }, []);

  // ─── Timer ───

  const startTimerFn = useCallback(
    async (projectId: string, description: string) => {
      if (!user) return;
      const entry = await startTimerService({ project_id: projectId, description });
      if (mountedRef.current) {
        setRunningEntry(entry);
        toast.success("Timer started");
      }
    },
    [user]
  );

  const stopTimerFn = useCallback(async () => {
    if (!runningEntry) return;
    const stopped = await stopTimerService(runningEntry.id);
    if (mountedRef.current) {
      setRunningEntry(null);
      setEntries((prev) => [stopped, ...prev]);
      toast.success("Timer stopped");
    }
  }, [runningEntry]);

  // ─── Time Entries ───

  const createEntry = useCallback(
    async (input: TimeEntryInput) => {
      if (!user) return;
      const created = await createEntryService(input);
      if (mountedRef.current) {
        setEntries((prev) => [created, ...prev]);
        toast.success("Time entry created");
      }
      return created;
    },
    [user]
  );

  const updateEntry = useCallback(
    async (id: string, input: TimeEntryInput) => {
      const updated = await updateEntryService(id, input);
      if (mountedRef.current) {
        setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
        toast.success("Time entry updated");
      }
      return updated;
    },
    []
  );

  const deleteEntry = useCallback(async (id: string) => {
    await deleteEntryService(id);
    if (mountedRef.current) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Time entry deleted");
    }
  }, []);

  // ─── Invoices ───

  const createInvoice = useCallback(
    async (input: InvoiceInput) => {
      if (!user) return;
      const created = await createInvoiceService(input);
      if (mountedRef.current) {
        setInvoices((prev) => [created, ...prev]);
        toast.success("Invoice created");
      }
      return created;
    },
    [user]
  );

  const updateInvoice = useCallback(
    async (id: string, input: InvoiceInput) => {
      const updated = await updateInvoiceService(id, input);
      if (mountedRef.current) {
        setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
        toast.success("Invoice updated");
      }
      return updated;
    },
    []
  );

  const updateInvoiceStatusFn = useCallback(
    async (id: string, status: string) => {
      const updated = await updateInvoiceStatusService(id, status);
      if (mountedRef.current) {
        setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
        toast.success("Invoice status updated");
      }
      return updated;
    },
    []
  );

  const deleteInvoice = useCallback(async (id: string) => {
    await deleteInvoiceService(id);
    if (mountedRef.current) {
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invoice deleted");
    }
  }, []);

  return {
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
    startTimer: startTimerFn,
    stopTimer: stopTimerFn,
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
    updateInvoiceStatus: updateInvoiceStatusFn,
    deleteInvoice,

    loading,
    error,
    refetch: fetchAll,
  };
}
