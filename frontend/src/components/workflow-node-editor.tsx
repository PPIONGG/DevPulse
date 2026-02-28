"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Globe,
  Clock,
  GitBranch,
  Shuffle,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  nodeTypes,
  httpMethods,
  conditionOperators,
  createDefaultNodeConfig,
  type WorkflowNodeData,
  type NodeType,
} from "@/config/workflow-nodes";
import { cn } from "@/lib/utils";

interface WorkflowNodeEditorProps {
  nodes: WorkflowNodeData[];
  onChange: (nodes: WorkflowNodeData[]) => void;
}

function getNodeIcon(type: string) {
  switch (type) {
    case "http_request":
      return <Globe className="size-4" />;
    case "delay":
      return <Clock className="size-4" />;
    case "condition":
      return <GitBranch className="size-4" />;
    case "transform":
      return <Shuffle className="size-4" />;
    case "notify":
      return <Bell className="size-4" />;
    default:
      return <Globe className="size-4" />;
  }
}

function getNodeColor(type: string) {
  const config = nodeTypes.find((n) => n.type === type);
  return config?.color ?? "bg-gray-500";
}

export function WorkflowNodeEditor({ nodes, onChange }: WorkflowNodeEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addNode = (type: NodeType) => {
    const nodeConfig = nodeTypes.find((n) => n.type === type);
    const newNode: WorkflowNodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      label: nodeConfig?.label ?? type,
      config: createDefaultNodeConfig(type),
    };
    onChange([...nodes, newNode]);
    setExpandedId(newNode.id);
  };

  const removeNode = (nodeId: string) => {
    onChange(nodes.filter((n) => n.id !== nodeId));
    if (expandedId === nodeId) setExpandedId(null);
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNodeData>) => {
    onChange(
      nodes.map((n) =>
        n.id === nodeId ? { ...n, ...updates } : n
      )
    );
  };

  const updateNodeConfig = (nodeId: string, key: string, value: unknown) => {
    onChange(
      nodes.map((n) =>
        n.id === nodeId
          ? { ...n, config: { ...n.config, [key]: value } }
          : n
      )
    );
  };

  const moveNode = (index: number, direction: "up" | "down") => {
    const newNodes = [...nodes];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newNodes.length) return;
    [newNodes[index], newNodes[targetIndex]] = [newNodes[targetIndex], newNodes[index]];
    onChange(newNodes);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Nodes ({nodes.length})
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 size-3.5" />
              Add Node
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {nodeTypes.map((nt) => (
              <DropdownMenuItem
                key={nt.type}
                onClick={() => addNode(nt.type as NodeType)}
              >
                {getNodeIcon(nt.type)}
                <span className="ml-2">{nt.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {nodes.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No nodes yet. Add a node to start building your workflow.
        </div>
      )}

      <div className="space-y-2">
        {nodes.map((node, index) => {
          const isExpanded = expandedId === node.id;
          return (
            <Card key={node.id} className="gap-0 py-0 overflow-hidden">
              {/* Node header */}
              <div
                className="flex cursor-pointer items-center gap-2 px-3 py-2.5 hover:bg-muted/50"
                onClick={() => setExpandedId(isExpanded ? null : node.id)}
              >
                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveNode(index, "up");
                    }}
                  >
                    <span className="text-xs">&#9650;</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    disabled={index === nodes.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveNode(index, "down");
                    }}
                  >
                    <span className="text-xs">&#9660;</span>
                  </Button>
                </div>
                <div className={cn("flex size-6 items-center justify-center rounded text-white", getNodeColor(node.type))}>
                  {getNodeIcon(node.type)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {node.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNode(node.id);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
                {isExpanded ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
              </div>

              {/* Node config (expanded) */}
              {isExpanded && (
                <div className="space-y-3 border-t px-3 py-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={node.label}
                      onChange={(e) =>
                        updateNode(node.id, { label: e.target.value })
                      }
                      placeholder="Step name"
                      className="h-8 text-sm"
                    />
                  </div>

                  <NodeConfigEditor
                    node={node}
                    onUpdateConfig={(key, value) =>
                      updateNodeConfig(node.id, key, value)
                    }
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface NodeConfigEditorProps {
  node: WorkflowNodeData;
  onUpdateConfig: (key: string, value: unknown) => void;
}

function NodeConfigEditor({ node, onUpdateConfig }: NodeConfigEditorProps) {
  switch (node.type) {
    case "http_request":
      return <HTTPRequestConfigEditor config={node.config} onUpdate={onUpdateConfig} />;
    case "delay":
      return <DelayConfigEditor config={node.config} onUpdate={onUpdateConfig} />;
    case "condition":
      return <ConditionConfigEditor config={node.config} onUpdate={onUpdateConfig} />;
    case "notify":
      return <NotifyConfigEditor config={node.config} onUpdate={onUpdateConfig} />;
    case "transform":
      return (
        <p className="text-xs text-muted-foreground">
          This node passes through data from the previous step without modification.
        </p>
      );
    default:
      return null;
  }
}

function HTTPRequestConfigEditor({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="w-[120px] space-y-1">
          <Label className="text-xs">Method</Label>
          <Select
            value={(config.method as string) || "GET"}
            onValueChange={(v) => onUpdate("method", v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {httpMethods.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">URL</Label>
          <Input
            value={(config.url as string) || ""}
            onChange={(e) => onUpdate("url", e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Headers (JSON)</Label>
        <Textarea
          value={
            typeof config.headers === "object" && config.headers !== null
              ? JSON.stringify(config.headers, null, 2)
              : "{}"
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onUpdate("headers", parsed);
            } catch {
              // Keep raw value for editing
            }
          }}
          placeholder='{"Content-Type": "application/json"}'
          className="min-h-[60px] font-mono text-xs"
        />
      </div>
      {((config.method as string) || "GET") !== "GET" && (
        <div className="space-y-1">
          <Label className="text-xs">Body</Label>
          <Textarea
            value={(config.body as string) || ""}
            onChange={(e) => onUpdate("body", e.target.value)}
            placeholder='{"key": "value"}'
            className="min-h-[60px] font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
}

function DelayConfigEditor({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Delay (seconds, max 30)</Label>
      <Input
        type="number"
        min={1}
        max={30}
        value={(config.seconds as number) || 5}
        onChange={(e) => onUpdate("seconds", Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
        className="h-8 w-32 text-sm"
      />
    </div>
  );
}

function ConditionConfigEditor({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Field name (from previous step output)</Label>
        <Input
          value={(config.field as string) || ""}
          onChange={(e) => onUpdate("field", e.target.value)}
          placeholder="e.g. status"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Operator</Label>
        <Select
          value={(config.operator as string) || "equals"}
          onValueChange={(v) => onUpdate("operator", v)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {conditionOperators.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Expected value</Label>
        <Input
          value={(config.value as string) || ""}
          onChange={(e) => onUpdate("value", e.target.value)}
          placeholder="e.g. 200"
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}

function NotifyConfigEditor({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Message</Label>
      <Textarea
        value={(config.message as string) || ""}
        onChange={(e) => onUpdate("message", e.target.value)}
        placeholder="Notification message..."
        className="min-h-[60px] text-sm"
      />
    </div>
  );
}
