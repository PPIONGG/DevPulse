"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  Globe,
  GitBranch,
  Shuffle,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/language-provider";
import type { WorkflowRun, WorkflowStepLog } from "@/lib/types/database";

interface WorkflowRunListProps {
  runs: WorkflowRun[];
  onFetchStepLogs: (runId: string) => Promise<WorkflowStepLog[]>;
}

function getStatusBadge(status: string, t: (key: any) => string) {
  switch (status) {
    case "success":
      return (
        <Badge variant="default" className="gap-1 bg-green-600 text-xs hover:bg-green-700">
          <CheckCircle2 className="size-3" />
          {t("workflows.statusSuccess")}
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <XCircle className="size-3" />
          {t("workflows.statusFailed")}
        </Badge>
      );
    case "running":
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Loader2 className="size-3 animate-spin" />
          {t("workflows.statusRunning")}
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          {t("workflows.statusCancelled")}
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function getStepIcon(type: string) {
  switch (type) {
    case "http_request":
      return <Globe className="size-3.5" />;
    case "delay":
      return <Clock className="size-3.5" />;
    case "condition":
      return <GitBranch className="size-3.5" />;
    case "transform":
      return <Shuffle className="size-3.5" />;
    case "notify":
      return <Bell className="size-3.5" />;
    default:
      return <Globe className="size-3.5" />;
  }
}

function getStepStatusColor(status: string) {
  switch (status) {
    case "success":
      return "text-green-500";
    case "failed":
      return "text-red-500";
    case "running":
      return "text-blue-500";
    case "skipped":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function WorkflowRunList({ runs, onFetchStepLogs }: WorkflowRunListProps) {
  const { t } = useTranslation();
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [stepLogs, setStepLogs] = useState<Record<string, WorkflowStepLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<string | null>(null);

  const toggleExpand = async (runId: string) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }
    setExpandedRunId(runId);
    if (!stepLogs[runId]) {
      setLoadingLogs(runId);
      try {
        const logs = await onFetchStepLogs(runId);
        setStepLogs((prev) => ({ ...prev, [runId]: logs }));
      } catch {
        // silently fail
      } finally {
        setLoadingLogs(null);
      }
    }
  };

  if (runs.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        {t("workflows.noRuns")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const isExpanded = expandedRunId === run.id;
        const logs = stepLogs[run.id] ?? [];
        const isLoading = loadingLogs === run.id;

        return (
          <Card key={run.id} className="gap-0 py-0 overflow-hidden">
            <div
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
              onClick={() => toggleExpand(run.id)}
            >
              {isExpanded ? (
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {getStatusBadge(run.status, t)}
                <Badge variant="outline" className="text-xs">
                  {run.trigger_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(run.started_at)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDuration(run.duration_ms)}
                </span>
              </div>
              {run.error && (
                <span className="max-w-[200px] truncate text-xs text-destructive">
                  {run.error}
                </span>
              )}
            </div>

            {isExpanded && (
              <div className="border-t">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">{t("workflows.loadingSteps")}</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {t("workflows.noStepLogs")}
                  </div>
                ) : (
                  <div className="px-4 py-2">
                    {logs.map((log, i) => (
                      <div key={log.id}>
                        {i > 0 && <Separator className="my-2" />}
                        <div className="flex items-start gap-2 py-1">
                          <div className={cn("mt-0.5", getStepStatusColor(log.status))}>
                            {log.status === "success" ? (
                              <CheckCircle2 className="size-4" />
                            ) : log.status === "failed" ? (
                              <XCircle className="size-4" />
                            ) : log.status === "running" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <div className="size-4 rounded-full border-2" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {getStepIcon(log.node_type)}
                              </span>
                              <span className="text-sm font-medium">{log.node_type}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(log.duration_ms)}
                              </span>
                            </div>
                            {log.error && (
                              <p className="mt-1 text-xs text-destructive">{log.error}</p>
                            )}
                            {log.output_data != null && Object.keys(typeof log.output_data === "string" ? {} : (log.output_data as Record<string, unknown>)).length > 0 && (
                              <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted px-2 py-1 font-mono text-xs">
                                {typeof log.output_data === "string"
                                  ? log.output_data
                                  : JSON.stringify(log.output_data, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
