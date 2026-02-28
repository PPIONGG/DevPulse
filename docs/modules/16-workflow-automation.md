# Module 16 — Workflow Automation Builder

> Difficulty: ⭐⭐⭐⭐⭐ | Three new tables | New packages: @xyflow/react | Requires: understanding of DAG execution

## Overview

A visual workflow builder where users create automation pipelines using a node-based canvas. Each workflow consists of a trigger node (cron schedule, webhook, or manual) connected to action nodes (HTTP request, transform data, conditional branch, delay, send notification). Workflows are saved to DB and executed by the Go backend. Users can view execution logs per run.

## PostgreSQL Migration

```sql
-- backend/database/migrations/020_create_workflows.up.sql

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'cron', 'webhook')),
    cron_expression TEXT NOT NULL DEFAULT '',     -- e.g., "0 9 * * 1-5" (9am weekdays)
    webhook_token TEXT,                           -- unique token for webhook URL
    nodes JSONB NOT NULL DEFAULT '[]',            -- [{id, type, position, data}]
    edges JSONB NOT NULL DEFAULT '[]',            -- [{id, source, target, sourceHandle, targetHandle}]
    last_run_at TIMESTAMPTZ,
    last_run_status TEXT,                         -- 'success' | 'failed' | 'running'
    run_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    trigger_type TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_step_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,              -- matches node id in workflow.nodes
    node_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'skipped')),
    input_data JSONB NOT NULL DEFAULT '{}',
    output_data JSONB NOT NULL DEFAULT '{}',
    error TEXT NOT NULL DEFAULT '',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_enabled ON workflows(is_enabled);
CREATE INDEX IF NOT EXISTS idx_workflows_webhook_token ON workflows(webhook_token);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON workflow_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_logs_run_id ON workflow_step_logs(run_id);
```

## Go Backend

### Model

```go
// backend/models/workflow.go

type NodePosition struct {
    X float64 `json:"x"`
    Y float64 `json:"y"`
}

type NodeData struct {
    Label       string            `json:"label"`
    Type        string            `json:"type"`       // http_request, transform, condition, delay, notify
    Config      map[string]any    `json:"config"`     // type-specific config
}

type WorkflowNode struct {
    ID       string       `json:"id"`
    Type     string       `json:"type"`
    Position NodePosition `json:"position"`
    Data     NodeData     `json:"data"`
}

type WorkflowEdge struct {
    ID           string `json:"id"`
    Source       string `json:"source"`
    Target       string `json:"target"`
    SourceHandle string `json:"sourceHandle,omitempty"`
    TargetHandle string `json:"targetHandle,omitempty"`
}

type Workflow struct {
    ID              uuid.UUID      `json:"id"`
    UserID          uuid.UUID      `json:"user_id"`
    Title           string         `json:"title"`
    Description     string         `json:"description"`
    IsEnabled       bool           `json:"is_enabled"`
    TriggerType     string         `json:"trigger_type"`
    CronExpression  string         `json:"cron_expression"`
    WebhookToken    *string        `json:"webhook_token,omitempty"`
    Nodes           []WorkflowNode `json:"nodes"`
    Edges           []WorkflowEdge `json:"edges"`
    LastRunAt       *time.Time     `json:"last_run_at"`
    LastRunStatus   *string        `json:"last_run_status"`
    RunCount        int            `json:"run_count"`
    CreatedAt       time.Time      `json:"created_at"`
    UpdatedAt       time.Time      `json:"updated_at"`
}

type WorkflowInput struct {
    Title          string         `json:"title"`
    Description    string         `json:"description"`
    IsEnabled      bool           `json:"is_enabled"`
    TriggerType    string         `json:"trigger_type"`
    CronExpression string         `json:"cron_expression"`
    Nodes          []WorkflowNode `json:"nodes"`
    Edges          []WorkflowEdge `json:"edges"`
}

type WorkflowRun struct {
    ID          uuid.UUID  `json:"id"`
    WorkflowID  uuid.UUID  `json:"workflow_id"`
    UserID      uuid.UUID  `json:"user_id"`
    Status      string     `json:"status"`
    TriggerType string     `json:"trigger_type"`
    StartedAt   time.Time  `json:"started_at"`
    FinishedAt  *time.Time `json:"finished_at"`
    DurationMs  *int       `json:"duration_ms"`
    Error       string     `json:"error"`
    CreatedAt   time.Time  `json:"created_at"`
}

type WorkflowStepLog struct {
    ID         uuid.UUID      `json:"id"`
    RunID      uuid.UUID      `json:"run_id"`
    NodeID     string         `json:"node_id"`
    NodeType   string         `json:"node_type"`
    Status     string         `json:"status"`
    InputData  map[string]any `json:"input_data"`
    OutputData map[string]any `json:"output_data"`
    Error      string         `json:"error"`
    StartedAt  time.Time      `json:"started_at"`
    FinishedAt *time.Time     `json:"finished_at"`
    DurationMs *int           `json:"duration_ms"`
}
```

### Execution Engine

```go
// backend/engine/workflow_engine.go

type WorkflowEngine struct {
    httpClient *http.Client
    pool       *pgxpool.Pool
}

// Execute runs a workflow as a DAG
func (e *WorkflowEngine) Execute(ctx context.Context, workflow *Workflow, triggerData map[string]any) (*WorkflowRun, error) {
    // 1. Create workflow_run record (status=running)
    // 2. Build DAG from nodes + edges (topological sort)
    // 3. Walk DAG from trigger node:
    //    For each node:
    //    a. Create step_log (status=running)
    //    b. Collect input from parent node outputs
    //    c. Execute node based on type:
    //       - http_request: make HTTP call, capture response
    //       - transform: apply JSONPath/template transformation
    //       - condition: evaluate expression, choose branch (true/false handles)
    //       - delay: time.Sleep
    //       - notify: log/webhook notification
    //    d. Save output_data to step_log
    //    e. If error: mark step failed, mark run failed, stop
    // 4. Mark workflow_run as success/failed
    // 5. Update workflow.last_run_at, last_run_status, run_count++
    return run, nil
}

// Node executors
func (e *WorkflowEngine) executeHTTPRequest(ctx, config, input) (output map[string]any, error)
func (e *WorkflowEngine) executeTransform(ctx, config, input) (output map[string]any, error)
func (e *WorkflowEngine) executeCondition(ctx, config, input) (branch string, error) // "true" or "false"
func (e *WorkflowEngine) executeDelay(ctx, config) error
func (e *WorkflowEngine) executeNotify(ctx, config, input) error
```

### Cron Scheduler

```go
// backend/engine/cron_scheduler.go

type CronScheduler struct {
    pool   *pgxpool.Pool
    engine *WorkflowEngine
}

// Start runs a goroutine that checks for due cron workflows every minute
func (s *CronScheduler) Start(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Minute)
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            s.checkAndRun(ctx)
        }
    }
}

func (s *CronScheduler) checkAndRun(ctx context.Context) {
    // 1. Query all enabled workflows with trigger_type='cron'
    // 2. For each, parse cron_expression and check if it matches current time
    // 3. If matches, execute workflow in a goroutine (with timeout)
}
```

### Handler

```go
// backend/handlers/workflow.go

type WorkflowHandler struct {
    workflowRepo *WorkflowRepo
    runRepo      *WorkflowRunRepo
    stepLogRepo  *WorkflowStepLogRepo
    engine       *WorkflowEngine
}

func (h *WorkflowHandler) List(w, r)          // GET    /api/workflows
func (h *WorkflowHandler) GetByID(w, r)       // GET    /api/workflows/{id}
func (h *WorkflowHandler) Create(w, r)        // POST   /api/workflows
func (h *WorkflowHandler) Update(w, r)        // PUT    /api/workflows/{id}
func (h *WorkflowHandler) Delete(w, r)        // DELETE /api/workflows/{id}
func (h *WorkflowHandler) Toggle(w, r)        // PATCH  /api/workflows/{id}/toggle
func (h *WorkflowHandler) RunManual(w, r)     // POST   /api/workflows/{id}/run

func (h *WorkflowHandler) ListRuns(w, r)      // GET    /api/workflows/{id}/runs
func (h *WorkflowHandler) GetRun(w, r)        // GET    /api/workflow-runs/{runId}
func (h *WorkflowHandler) GetStepLogs(w, r)   // GET    /api/workflow-runs/{runId}/steps

func (h *WorkflowHandler) WebhookTrigger(w,r) // POST   /api/webhooks/{token} (NO auth)
// Finds workflow by webhook_token, executes it with request body as trigger data
```

### Routes

```go
// Add to backend/router/router.go

mux.Handle("GET /api/workflows", authMW(http.HandlerFunc(workflow.List)))
mux.Handle("GET /api/workflows/{id}", authMW(http.HandlerFunc(workflow.GetByID)))
mux.Handle("POST /api/workflows", authMW(http.HandlerFunc(workflow.Create)))
mux.Handle("PUT /api/workflows/{id}", authMW(http.HandlerFunc(workflow.Update)))
mux.Handle("DELETE /api/workflows/{id}", authMW(http.HandlerFunc(workflow.Delete)))
mux.Handle("PATCH /api/workflows/{id}/toggle", authMW(http.HandlerFunc(workflow.Toggle)))
mux.Handle("POST /api/workflows/{id}/run", authMW(http.HandlerFunc(workflow.RunManual)))

mux.Handle("GET /api/workflows/{id}/runs", authMW(http.HandlerFunc(workflow.ListRuns)))
mux.Handle("GET /api/workflow-runs/{runId}", authMW(http.HandlerFunc(workflow.GetRun)))
mux.Handle("GET /api/workflow-runs/{runId}/steps", authMW(http.HandlerFunc(workflow.GetStepLogs)))

// Webhook trigger (NO auth — token-based)
mux.Handle("POST /api/webhooks/{token}", http.HandlerFunc(workflow.WebhookTrigger))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface WorkflowNodePosition {
  x: number;
  y: number;
}

export interface WorkflowNodeData {
  label: string;
  type: "http_request" | "transform" | "condition" | "delay" | "notify";
  config: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: WorkflowNodePosition;
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_enabled: boolean;
  trigger_type: "manual" | "cron" | "webhook";
  cron_expression: string;
  webhook_token?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  last_run_at: string | null;
  last_run_status: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export type WorkflowInput = Pick<
  Workflow,
  "title" | "description" | "is_enabled" | "trigger_type" | "cron_expression" | "nodes" | "edges"
>;

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: "running" | "success" | "failed" | "cancelled";
  trigger_type: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error: string;
  created_at: string;
}

export interface WorkflowStepLog {
  id: string;
  run_id: string;
  node_id: string;
  node_type: string;
  status: "running" | "success" | "failed" | "skipped";
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
}
```

## Service Functions

```ts
// lib/services/workflows.ts

import { api } from "@/lib/api/client";
import type { Workflow, WorkflowInput, WorkflowRun, WorkflowStepLog } from "@/lib/types/database";

export async function getWorkflows(): Promise<Workflow[]> { return api.get("/api/workflows"); }
export async function getWorkflow(id: string): Promise<Workflow> { return api.get(`/api/workflows/${id}`); }
export async function createWorkflow(input: WorkflowInput): Promise<Workflow> { return api.post("/api/workflows", input); }
export async function updateWorkflow(id: string, input: WorkflowInput): Promise<Workflow> { return api.put(`/api/workflows/${id}`, input); }
export async function deleteWorkflow(id: string): Promise<void> { await api.delete(`/api/workflows/${id}`); }
export async function toggleWorkflow(id: string): Promise<Workflow> { return api.patch(`/api/workflows/${id}/toggle`, {}); }
export async function runWorkflow(id: string): Promise<WorkflowRun> { return api.post(`/api/workflows/${id}/run`, {}); }

export async function getWorkflowRuns(workflowId: string): Promise<WorkflowRun[]> {
  return api.get(`/api/workflows/${workflowId}/runs`);
}
export async function getWorkflowRun(runId: string): Promise<WorkflowRun> {
  return api.get(`/api/workflow-runs/${runId}`);
}
export async function getStepLogs(runId: string): Promise<WorkflowStepLog[]> {
  return api.get(`/api/workflow-runs/${runId}/steps`);
}
```

## Components

### WorkflowCard — List item showing title, trigger type, status, last run, run count, enable toggle

### WorkflowForm — Dialog to create/edit workflow metadata (title, description, trigger config)

### WorkflowCanvas — Main visual editor using @xyflow/react (React Flow)

Node types on canvas:
- **TriggerNode** — Entry point (manual button / cron schedule / webhook URL)
- **HttpRequestNode** — Method, URL, headers, body config
- **TransformNode** — JSONPath expression or JS-like template to reshape data
- **ConditionNode** — Expression evaluator with true/false output handles
- **DelayNode** — Wait N seconds/minutes
- **NotifyNode** — Log message or webhook notification

### WorkflowRunList — Table of past runs with status, duration, trigger type

### WorkflowRunDetail — Step-by-step execution view showing each node's input/output/error

### NodeConfigPanel — Right sidebar that appears when a node is selected, showing node-specific config form

### Skeleton — Loading states

## Page Layout

```
app/(app)/workflows/page.tsx — Workflow list
app/(app)/workflows/[id]/page.tsx — Canvas editor
app/(app)/workflows/[id]/runs/page.tsx — Run history
```

### Workflow List

```
┌────────────────────────────────────────────────────────────────┐
│ Workflows                                   [+ New Workflow]    │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 🟢 Daily Report Generator          Cron: 0 9 * * 1-5    │   │
│ │ Last run: 2 hours ago (success)     Runs: 142   [ON/OFF]│   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ 🔴 Deploy Notifier                 Webhook              │   │
│ │ Last run: 1 day ago (failed)        Runs: 23    [ON/OFF]│   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ ⚪ Data Sync Pipeline               Manual               │   │
│ │ Never run                           Runs: 0     [ON/OFF]│   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### Canvas Editor

```
┌────────────────────────────────────────────────────────────────────┐
│ [← Back]  Daily Report Generator       [▶ Run Now] [💾 Save]      │
├──────────────────────────────────────────────────────┬─────────────┤
│                                                      │ Node Config │
│   ┌──────────┐                                       │             │
│   │ ⏰ Cron  │                                       │ HTTP Request│
│   │ 9am M-F  │                                       │             │
│   └────┬─────┘                                       │ Method: GET │
│        │                                             │ URL: {{..}} │
│        ▼                                             │ Headers:    │
│   ┌──────────┐      ┌──────────┐                     │  Auth: ...  │
│   │ 🌐 HTTP  │──────│ 🔀 Check │                     │             │
│   │ Fetch API│      │ status   │                     │ [Test Node] │
│   └──────────┘      └──┬───┬──┘                      │             │
│                    true │   │ false                   │             │
│                         ▼   ▼                        │             │
│                  ┌────────┐ ┌────────┐               │             │
│                  │ 📧 Notif│ │ 📧 Notif│               │             │
│                  │ Success │ │ Alert  │               │             │
│                  └────────┘ └────────┘               │             │
│                                                      │             │
│  [+ HTTP] [+ Transform] [+ Condition] [+ Delay]     │             │
│  [+ Notify]                                          │             │
├──────────────────────────────────────────────────────┴─────────────┤
│  Runs │ 142 total │ Last: ✅ 2h ago │ [View History]               │
└────────────────────────────────────────────────────────────────────┘
```

## Navigation

```ts
import { Workflow } from "lucide-react";

{
  title: "Workflows",
  href: "/workflows",
  icon: Workflow,
}
```

## npm Packages

```bash
npm install @xyflow/react
```

## Logic Notes

### DAG Execution (Topological Sort)

```go
func topologicalSort(nodes []WorkflowNode, edges []WorkflowEdge) ([]string, error) {
    // Kahn's algorithm:
    // 1. Build adjacency list and in-degree map from edges
    // 2. Start with nodes that have in-degree 0 (trigger node)
    // 3. Process queue: for each node, reduce in-degree of children
    // 4. Return ordered list of node IDs
    // 5. Error if cycle detected (remaining nodes with in-degree > 0)
}
```

### Condition Branching

Condition nodes have two output handles: `true` and `false`. The edge's `sourceHandle` determines which branch to follow. The engine evaluates a simple expression (e.g., `status == 200`, `data.count > 0`) and follows the matching branch.

### Data Passing Between Nodes

Each node receives input from its parent node's output. For nodes with multiple parents (merge), inputs are combined. The data flows as JSON objects through the DAG.

### Webhook Token

Generated as a random 32-char hex string on workflow creation. The webhook URL is:
`{BACKEND_URL}/api/webhooks/{token}`

External services POST to this URL to trigger the workflow. The request body becomes the trigger's input data.

### Cron Parsing

Use a Go cron library (`robfig/cron/v3`) or implement basic 5-field cron parsing (minute, hour, day, month, weekday). The scheduler goroutine checks every minute.

### Execution Timeout

Each workflow run has a maximum execution time of 5 minutes. Each individual node has a 30-second timeout. The engine uses `context.WithTimeout` for enforcement.

### React Flow Integration

```tsx
import { ReactFlow, Background, Controls, MiniMap, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Custom node types
const nodeTypes = {
  trigger: TriggerNode,
  httpRequest: HttpRequestNode,
  transform: TransformNode,
  condition: ConditionNode,
  delay: DelayNode,
  notify: NotifyNode,
};
```
