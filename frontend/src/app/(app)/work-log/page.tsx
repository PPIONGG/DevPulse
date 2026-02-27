"use client";

import { useState, useMemo } from "react";
import { Plus, Search, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { WorkLogCard } from "@/components/work-log-card";
import { WorkLogForm } from "@/components/work-log-form";
import { WorkLogCardSkeleton } from "@/components/skeletons";
import { useWorkLogs } from "@/hooks/use-work-logs";
import { workLogCategories } from "@/config/categories";
import { toast } from "sonner";
import type { WorkLog, WorkLogInput } from "@/lib/types/database";

export default function WorkLogPage() {
  const {
    workLogs,
    loading,
    error,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    refetch,
  } = useWorkLogs();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<WorkLog | null>(null);

  const filtered = useMemo(() => {
    let result = workLogs;
    if (categoryFilter !== "all") {
      result = result.filter((w) => w.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.content.toLowerCase().includes(q) ||
          w.date.includes(q)
      );
    }
    return result;
  }, [workLogs, search, categoryFilter]);

  const handleCreate = async (data: WorkLogInput) => {
    await createWorkLog(data);
  };

  const handleEdit = (workLog: WorkLog) => {
    setEditingLog(workLog);
    setFormOpen(true);
  };

  const handleUpdate = async (data: WorkLogInput) => {
    if (!editingLog) return;
    await updateWorkLog(editingLog.id, data);
    setEditingLog(null);
  };

  const handleDelete = async () => {
    if (!deletingLog) return;
    try {
      await deleteWorkLog(deletingLog.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete work log");
    } finally {
      setDeletingLog(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingLog(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Work Log</h2>
          <p className="mt-1 text-muted-foreground">
            Track your daily development progress.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Entry
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search work logs..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {workLogCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <WorkLogCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {search || categoryFilter !== "all"
              ? "No matching work logs"
              : "No work logs yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || categoryFilter !== "all"
              ? "Try a different search term or filter."
              : "Create your first work log entry to get started."}
          </p>
          {!search && categoryFilter === "all" && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              New Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((workLog) => (
            <WorkLogCard
              key={workLog.id}
              workLog={workLog}
              onEdit={handleEdit}
              onDelete={setDeletingLog}
            />
          ))}
        </div>
      )}

      <WorkLogForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        workLog={editingLog}
        onSubmit={editingLog ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingLog}
        onOpenChange={(open) => !open && setDeletingLog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete work log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingLog?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
