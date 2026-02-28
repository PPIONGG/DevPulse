"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  Zap,
  Clock,
  Webhook,
  Hand,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Workflow } from "@/lib/types/database";

interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  onToggle: (workflow: Workflow) => void;
  onRun: (workflow: Workflow) => void;
  onClick: (workflow: Workflow) => void;
  running?: boolean;
}

function getTriggerIcon(type: string) {
  switch (type) {
    case "manual":
      return <Hand className="size-3" />;
    case "webhook":
      return <Webhook className="size-3" />;
    case "cron":
      return <Clock className="size-3" />;
    default:
      return <Hand className="size-3" />;
  }
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="size-3.5 text-green-500" />;
    case "failed":
      return <XCircle className="size-3.5 text-red-500" />;
    case "running":
      return <Loader2 className="size-3.5 animate-spin text-blue-500" />;
    default:
      return null;
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function WorkflowCard({
  workflow,
  onEdit,
  onDelete,
  onToggle,
  onRun,
  onClick,
  running,
}: WorkflowCardProps) {
  const nodes = (() => {
    try {
      return JSON.parse(typeof workflow.nodes === "string" ? workflow.nodes : JSON.stringify(workflow.nodes));
    } catch {
      return [];
    }
  })();

  return (
    <Card
      className="gap-0 cursor-pointer py-0 transition-colors hover:bg-muted/50"
      onClick={() => onClick(workflow)}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              workflow.is_enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            <Zap className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">
                {workflow.title}
              </CardTitle>
              <Badge
                variant={workflow.is_enabled ? "default" : "secondary"}
                className="shrink-0 text-xs"
              >
                {workflow.is_enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                {getTriggerIcon(workflow.trigger_type)}
                {workflow.trigger_type}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{nodes.length} node{nodes.length !== 1 ? "s" : ""}</span>
              <span className="text-border">|</span>
              <span>{workflow.run_count} run{workflow.run_count !== 1 ? "s" : ""}</span>
              {workflow.last_run_status && (
                <>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(workflow.last_run_status)}
                    {formatTimeAgo(workflow.last_run_at)}
                  </span>
                </>
              )}
              {workflow.description && (
                <>
                  <span className="text-border">|</span>
                  <span className="truncate">{workflow.description}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={running}
            onClick={(e) => {
              e.stopPropagation();
              onRun(workflow);
            }}
            title="Run now"
          >
            {running ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(workflow);
                }}
              >
                <Zap className="mr-2 size-4" />
                {workflow.is_enabled ? "Disable" : "Enable"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(workflow);
                }}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(workflow);
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  );
}
