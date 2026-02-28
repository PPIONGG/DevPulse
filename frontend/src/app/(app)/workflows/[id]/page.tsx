"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Save,
  Loader2,
  Zap,
  Hand,
  Webhook,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowNodeEditor } from "@/components/workflow-node-editor";
import { WorkflowRunList } from "@/components/workflow-run-list";
import { useWorkflowDetail } from "@/hooks/use-workflows";
import { triggerTypes } from "@/config/workflow-nodes";
import { toast } from "sonner";
import type { WorkflowNodeData } from "@/config/workflow-nodes";
import type { WorkflowInput } from "@/lib/types/database";

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    workflow,
    runs,
    loading,
    error,
    updateWorkflow,
    runManual,
    fetchStepLogs,
    refetch,
  } = useWorkflowDetail(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [cronExpression, setCronExpression] = useState("");
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([]);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from workflow data
  useEffect(() => {
    if (workflow && !initialized) {
      setTitle(workflow.title);
      setDescription(workflow.description);
      setTriggerType(workflow.trigger_type);
      setCronExpression(workflow.cron_expression);
      try {
        const parsed = typeof workflow.nodes === "string"
          ? JSON.parse(workflow.nodes)
          : workflow.nodes;
        setNodes(Array.isArray(parsed) ? parsed : []);
      } catch {
        setNodes([]);
      }
      setInitialized(true);
    }
  }, [workflow, initialized]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const input: WorkflowInput = {
        title,
        description,
        is_enabled: workflow?.is_enabled ?? false,
        trigger_type: triggerType,
        cron_expression: cronExpression,
        nodes,
        edges: [],
      };
      await updateWorkflow(input);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      await runManual();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run workflow");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/workflows")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Workflow</h2>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/workflows")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                {workflow.title}
              </h2>
              <Badge variant={workflow.is_enabled ? "default" : "secondary"}>
                {workflow.is_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {workflow.run_count} run{workflow.run_count !== 1 ? "s" : ""}
              {workflow.last_run_status && (
                <> &middot; Last: {workflow.last_run_status}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRun}
            disabled={running}
          >
            {running ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Play className="mr-2 size-4" />
            )}
            Run Now
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <Separator />

      {/* Workflow settings */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="detail-title">Title</Label>
          <Input
            id="detail-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Workflow title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="detail-trigger">Trigger Type</Label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger id="detail-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {triggerTypes.map((t) => (
                <SelectItem
                  key={t.value}
                  value={t.value}
                  disabled={t.disabled}
                >
                  <span className="flex items-center gap-2">
                    {t.value === "manual" && <Hand className="size-3.5" />}
                    {t.value === "webhook" && <Webhook className="size-3.5" />}
                    {t.value === "cron" && <Clock className="size-3.5" />}
                    {t.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="detail-description">Description</Label>
          <Textarea
            id="detail-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="min-h-[60px]"
          />
        </div>
        {triggerType === "cron" && (
          <div className="space-y-2">
            <Label htmlFor="detail-cron">Cron Expression</Label>
            <Input
              id="detail-cron"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="*/5 * * * *"
            />
          </div>
        )}
        {triggerType === "webhook" && workflow.webhook_token && (
          <div className="space-y-2 md:col-span-2">
            <Label>Webhook URL</Label>
            <Input
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/${workflow.webhook_token}`}
              className="font-mono text-xs"
              onClick={(e) => {
                (e.target as HTMLInputElement).select();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Send a POST request to this URL to trigger the workflow.
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Node editor */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          <h3 className="text-lg font-semibold">Workflow Steps</h3>
        </div>
        <WorkflowNodeEditor nodes={nodes} onChange={setNodes} />
      </div>

      <Separator />

      {/* Run history */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Run History</h3>
        <WorkflowRunList runs={runs} onFetchStepLogs={fetchStepLogs} />
      </div>
    </div>
  );
}
