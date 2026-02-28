"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Zap } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowCard } from "@/components/workflow-card";
import { WorkflowForm } from "@/components/workflow-form";
import { useWorkflows } from "@/hooks/use-workflows";
import { toast } from "sonner";
import type { Workflow, WorkflowInput } from "@/lib/types/database";

function WorkflowCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const router = useRouter();
  const {
    workflows,
    loading,
    error,
    createWorkflow,
    deleteWorkflow,
    toggleEnabled,
    runManual,
    refetch,
  } = useWorkflows();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = workflows;
    if (filter === "enabled") {
      result = result.filter((w) => w.is_enabled);
    } else if (filter === "disabled") {
      result = result.filter((w) => !w.is_enabled);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [workflows, search, filter]);

  const hasFilters = search.trim() || filter !== "all";

  const handleCreate = async (data: WorkflowInput) => {
    const created = await createWorkflow(data);
    if (created) {
      router.push(`/workflows/${created.id}`);
    }
  };

  const handleEdit = (workflow: Workflow) => {
    router.push(`/workflows/${workflow.id}`);
  };

  const handleDelete = async () => {
    if (!deletingWorkflow) return;
    try {
      await deleteWorkflow(deletingWorkflow.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete workflow"
      );
    } finally {
      setDeletingWorkflow(null);
    }
  };

  const handleToggle = async (workflow: Workflow) => {
    try {
      await toggleEnabled(workflow.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle workflow"
      );
    }
  };

  const handleRun = async (workflow: Workflow) => {
    setRunningId(workflow.id);
    try {
      await runManual(workflow.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to run workflow"
      );
    } finally {
      setRunningId(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingWorkflow(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflows</h2>
          <p className="mt-1 text-muted-foreground">
            Build and run automated workflows.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Workflow
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Workflows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workflows</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <WorkflowCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Zap className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {hasFilters ? "No matching workflows" : "No workflows yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different search term or filter."
              : "Create your first workflow to automate tasks."}
          </p>
          {!hasFilters && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              New Workflow
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onEdit={handleEdit}
              onDelete={setDeletingWorkflow}
              onToggle={handleToggle}
              onRun={handleRun}
              onClick={handleEdit}
              running={runningId === workflow.id}
            />
          ))}
        </div>
      )}

      <WorkflowForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        workflow={editingWorkflow}
        onSubmit={handleCreate}
      />

      <AlertDialog
        open={!!deletingWorkflow}
        onOpenChange={(open) => !open && setDeletingWorkflow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingWorkflow?.title}&quot; and
              all its run history. This action cannot be undone.
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
