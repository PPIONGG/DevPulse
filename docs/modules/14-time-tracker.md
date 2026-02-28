# Module 14 — Project Time Tracker + Invoice Generator

> Difficulty: ⭐⭐⭐⭐ | Four new tables | New packages: recharts, @react-pdf/renderer

## Overview

Track billable and non-billable time across projects and clients. Features a start/stop timer and manual time entries. Generates professional PDF invoices with line items computed from tracked time. Includes weekly/monthly reports with charts.

## PostgreSQL Migration

```sql
-- backend/database/migrations/018_create_time_tracker.up.sql

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6b7280',
    hourly_rate NUMERIC(10,2),   -- overrides client rate if set
    budget_hours NUMERIC(10,2),  -- optional hour budget
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,                -- NULL = timer still running
    duration INTEGER NOT NULL DEFAULT 0, -- seconds (computed on stop, or manual)
    is_billable BOOLEAN NOT NULL DEFAULT true,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,          -- e.g., INV-2026-001
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT NOT NULL DEFAULT '',
    line_items JSONB NOT NULL DEFAULT '[]', -- [{description, hours, rate, amount}]
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Auto-increment invoice number per user
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq;
```

## Go Backend

### Model

```go
// backend/models/time_tracker.go

type Client struct {
    ID         uuid.UUID `json:"id"`
    UserID     uuid.UUID `json:"user_id"`
    Name       string    `json:"name"`
    Email      string    `json:"email"`
    Company    string    `json:"company"`
    Address    string    `json:"address"`
    Phone      string    `json:"phone"`
    Notes      string    `json:"notes"`
    HourlyRate float64   `json:"hourly_rate"`
    Currency   string    `json:"currency"`
    CreatedAt  time.Time `json:"created_at"`
    UpdatedAt  time.Time `json:"updated_at"`
}

type ClientInput struct {
    Name       string  `json:"name"`
    Email      string  `json:"email"`
    Company    string  `json:"company"`
    Address    string  `json:"address"`
    Phone      string  `json:"phone"`
    Notes      string  `json:"notes"`
    HourlyRate float64 `json:"hourly_rate"`
    Currency   string  `json:"currency"`
}

type Project struct {
    ID          uuid.UUID  `json:"id"`
    UserID      uuid.UUID  `json:"user_id"`
    ClientID    *uuid.UUID `json:"client_id"`
    Title       string     `json:"title"`
    Description string     `json:"description"`
    Color       string     `json:"color"`
    HourlyRate  *float64   `json:"hourly_rate"`
    BudgetHours *float64   `json:"budget_hours"`
    IsArchived  bool       `json:"is_archived"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
}

type ProjectInput struct {
    ClientID    *uuid.UUID `json:"client_id"`
    Title       string     `json:"title"`
    Description string     `json:"description"`
    Color       string     `json:"color"`
    HourlyRate  *float64   `json:"hourly_rate"`
    BudgetHours *float64   `json:"budget_hours"`
}

type TimeEntry struct {
    ID          uuid.UUID  `json:"id"`
    UserID      uuid.UUID  `json:"user_id"`
    ProjectID   uuid.UUID  `json:"project_id"`
    Description string     `json:"description"`
    StartTime   time.Time  `json:"start_time"`
    EndTime     *time.Time `json:"end_time"`
    Duration    int        `json:"duration"`
    IsBillable  bool       `json:"is_billable"`
    Tags        []string   `json:"tags"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
}

type TimeEntryInput struct {
    ProjectID   uuid.UUID `json:"project_id"`
    Description string    `json:"description"`
    StartTime   time.Time `json:"start_time"`
    EndTime     *time.Time `json:"end_time"`
    Duration    int        `json:"duration"`
    IsBillable  bool       `json:"is_billable"`
    Tags        []string   `json:"tags"`
}

type InvoiceLineItem struct {
    Description string  `json:"description"`
    Hours       float64 `json:"hours"`
    Rate        float64 `json:"rate"`
    Amount      float64 `json:"amount"`
}

type Invoice struct {
    ID            uuid.UUID         `json:"id"`
    UserID        uuid.UUID         `json:"user_id"`
    ClientID      *uuid.UUID        `json:"client_id"`
    InvoiceNumber string            `json:"invoice_number"`
    Status        string            `json:"status"`
    IssueDate     string            `json:"issue_date"`
    DueDate       string            `json:"due_date"`
    Subtotal      float64           `json:"subtotal"`
    TaxRate       float64           `json:"tax_rate"`
    TaxAmount     float64           `json:"tax_amount"`
    Total         float64           `json:"total"`
    Currency      string            `json:"currency"`
    Notes         string            `json:"notes"`
    LineItems     []InvoiceLineItem `json:"line_items"`
    PaidAt        *time.Time        `json:"paid_at"`
    CreatedAt     time.Time         `json:"created_at"`
    UpdatedAt     time.Time         `json:"updated_at"`
}

type InvoiceInput struct {
    ClientID  *uuid.UUID        `json:"client_id"`
    DueDate   string            `json:"due_date"`
    TaxRate   float64           `json:"tax_rate"`
    Currency  string            `json:"currency"`
    Notes     string            `json:"notes"`
    LineItems []InvoiceLineItem `json:"line_items"`
}

// Reports
type TimeReport struct {
    TotalHours    float64              `json:"total_hours"`
    BillableHours float64              `json:"billable_hours"`
    TotalAmount   float64              `json:"total_amount"`
    ByProject     []ProjectTimeSummary `json:"by_project"`
    ByDay         []DailyTimeSummary   `json:"by_day"`
}

type ProjectTimeSummary struct {
    ProjectID   uuid.UUID `json:"project_id"`
    ProjectName string    `json:"project_name"`
    Color       string    `json:"color"`
    Hours       float64   `json:"hours"`
    Amount      float64   `json:"amount"`
}

type DailyTimeSummary struct {
    Date  string  `json:"date"`
    Hours float64 `json:"hours"`
}
```

### Repository

```go
// backend/repository/time_tracker_repo.go

type ClientRepo struct { pool *pgxpool.Pool }
func (r *ClientRepo) List(ctx, userID) ([]Client, error)
func (r *ClientRepo) Create(ctx, userID, input) (*Client, error)
func (r *ClientRepo) Update(ctx, userID, id, input) (*Client, error)
func (r *ClientRepo) Delete(ctx, userID, id) error

type ProjectRepo struct { pool *pgxpool.Pool }
func (r *ProjectRepo) List(ctx, userID) ([]Project, error)  // exclude archived by default
func (r *ProjectRepo) Create(ctx, userID, input) (*Project, error)
func (r *ProjectRepo) Update(ctx, userID, id, input) (*Project, error)
func (r *ProjectRepo) Archive(ctx, userID, id) error
func (r *ProjectRepo) Delete(ctx, userID, id) error

type TimeEntryRepo struct { pool *pgxpool.Pool }
func (r *TimeEntryRepo) List(ctx, userID, filters) ([]TimeEntry, error)
// filters: project_id, date_from, date_to, is_billable
func (r *TimeEntryRepo) GetRunning(ctx, userID) (*TimeEntry, error)
// WHERE end_time IS NULL
func (r *TimeEntryRepo) Create(ctx, userID, input) (*TimeEntry, error)
func (r *TimeEntryRepo) Update(ctx, userID, id, input) (*TimeEntry, error)
func (r *TimeEntryRepo) Stop(ctx, userID, id) (*TimeEntry, error)
// SET end_time = now(), duration = EXTRACT(EPOCH FROM now() - start_time)
func (r *TimeEntryRepo) Delete(ctx, userID, id) error

func (r *TimeEntryRepo) GetReport(ctx, userID, dateFrom, dateTo) (*TimeReport, error)
// Aggregates: total hours, billable hours, amount by project, hours by day

type InvoiceRepo struct { pool *pgxpool.Pool }
func (r *InvoiceRepo) List(ctx, userID) ([]Invoice, error)
func (r *InvoiceRepo) GetByID(ctx, userID, id) (*Invoice, error)
func (r *InvoiceRepo) Create(ctx, userID, input) (*Invoice, error)
func (r *InvoiceRepo) Update(ctx, userID, id, input) (*Invoice, error)
func (r *InvoiceRepo) UpdateStatus(ctx, userID, id, status) (*Invoice, error)
func (r *InvoiceRepo) Delete(ctx, userID, id) error
func (r *InvoiceRepo) NextInvoiceNumber(ctx, userID) (string, error)
// Format: INV-{year}-{sequential_number}

func (r *InvoiceRepo) GeneratePDF(ctx, invoice, client) ([]byte, error)
// Uses Go template + PDF library to generate invoice PDF
```

### Handler

```go
// backend/handlers/time_tracker.go

type TimeTrackerHandler struct {
    clientRepo    *ClientRepo
    projectRepo   *ProjectRepo
    timeEntryRepo *TimeEntryRepo
    invoiceRepo   *InvoiceRepo
}

// Clients
func (h *TimeTrackerHandler) ListClients(w, r)    // GET    /api/clients
func (h *TimeTrackerHandler) CreateClient(w, r)    // POST   /api/clients
func (h *TimeTrackerHandler) UpdateClient(w, r)    // PUT    /api/clients/{id}
func (h *TimeTrackerHandler) DeleteClient(w, r)    // DELETE /api/clients/{id}

// Projects
func (h *TimeTrackerHandler) ListProjects(w, r)    // GET    /api/projects
func (h *TimeTrackerHandler) CreateProject(w, r)    // POST   /api/projects
func (h *TimeTrackerHandler) UpdateProject(w, r)    // PUT    /api/projects/{id}
func (h *TimeTrackerHandler) ArchiveProject(w, r)   // PATCH  /api/projects/{id}/archive
func (h *TimeTrackerHandler) DeleteProject(w, r)    // DELETE /api/projects/{id}

// Time entries
func (h *TimeTrackerHandler) ListEntries(w, r)      // GET    /api/time-entries
func (h *TimeTrackerHandler) GetRunning(w, r)        // GET    /api/time-entries/running
func (h *TimeTrackerHandler) StartTimer(w, r)        // POST   /api/time-entries/start
func (h *TimeTrackerHandler) StopTimer(w, r)         // POST   /api/time-entries/{id}/stop
func (h *TimeTrackerHandler) CreateEntry(w, r)       // POST   /api/time-entries
func (h *TimeTrackerHandler) UpdateEntry(w, r)       // PUT    /api/time-entries/{id}
func (h *TimeTrackerHandler) DeleteEntry(w, r)       // DELETE /api/time-entries/{id}

// Reports
func (h *TimeTrackerHandler) GetReport(w, r)         // GET    /api/time-entries/report?from=&to=

// Invoices
func (h *TimeTrackerHandler) ListInvoices(w, r)      // GET    /api/invoices
func (h *TimeTrackerHandler) GetInvoice(w, r)         // GET    /api/invoices/{id}
func (h *TimeTrackerHandler) CreateInvoice(w, r)      // POST   /api/invoices
func (h *TimeTrackerHandler) UpdateInvoice(w, r)      // PUT    /api/invoices/{id}
func (h *TimeTrackerHandler) UpdateInvoiceStatus(w,r) // PATCH  /api/invoices/{id}/status
func (h *TimeTrackerHandler) DeleteInvoice(w, r)      // DELETE /api/invoices/{id}
func (h *TimeTrackerHandler) DownloadPDF(w, r)        // GET    /api/invoices/{id}/pdf
// Returns application/pdf with Content-Disposition: attachment
```

### Routes

```go
// Add to backend/router/router.go

// Clients
mux.Handle("GET /api/clients", authMW(http.HandlerFunc(timeTracker.ListClients)))
mux.Handle("POST /api/clients", authMW(http.HandlerFunc(timeTracker.CreateClient)))
mux.Handle("PUT /api/clients/{id}", authMW(http.HandlerFunc(timeTracker.UpdateClient)))
mux.Handle("DELETE /api/clients/{id}", authMW(http.HandlerFunc(timeTracker.DeleteClient)))

// Projects
mux.Handle("GET /api/projects", authMW(http.HandlerFunc(timeTracker.ListProjects)))
mux.Handle("POST /api/projects", authMW(http.HandlerFunc(timeTracker.CreateProject)))
mux.Handle("PUT /api/projects/{id}", authMW(http.HandlerFunc(timeTracker.UpdateProject)))
mux.Handle("PATCH /api/projects/{id}/archive", authMW(http.HandlerFunc(timeTracker.ArchiveProject)))
mux.Handle("DELETE /api/projects/{id}", authMW(http.HandlerFunc(timeTracker.DeleteProject)))

// Time entries
mux.Handle("GET /api/time-entries", authMW(http.HandlerFunc(timeTracker.ListEntries)))
mux.Handle("GET /api/time-entries/running", authMW(http.HandlerFunc(timeTracker.GetRunning)))
mux.Handle("POST /api/time-entries/start", authMW(http.HandlerFunc(timeTracker.StartTimer)))
mux.Handle("POST /api/time-entries/{id}/stop", authMW(http.HandlerFunc(timeTracker.StopTimer)))
mux.Handle("POST /api/time-entries", authMW(http.HandlerFunc(timeTracker.CreateEntry)))
mux.Handle("PUT /api/time-entries/{id}", authMW(http.HandlerFunc(timeTracker.UpdateEntry)))
mux.Handle("DELETE /api/time-entries/{id}", authMW(http.HandlerFunc(timeTracker.DeleteEntry)))
mux.Handle("GET /api/time-entries/report", authMW(http.HandlerFunc(timeTracker.GetReport)))

// Invoices
mux.Handle("GET /api/invoices", authMW(http.HandlerFunc(timeTracker.ListInvoices)))
mux.Handle("GET /api/invoices/{id}", authMW(http.HandlerFunc(timeTracker.GetInvoice)))
mux.Handle("POST /api/invoices", authMW(http.HandlerFunc(timeTracker.CreateInvoice)))
mux.Handle("PUT /api/invoices/{id}", authMW(http.HandlerFunc(timeTracker.UpdateInvoice)))
mux.Handle("PATCH /api/invoices/{id}/status", authMW(http.HandlerFunc(timeTracker.UpdateInvoiceStatus)))
mux.Handle("DELETE /api/invoices/{id}", authMW(http.HandlerFunc(timeTracker.DeleteInvoice)))
mux.Handle("GET /api/invoices/{id}/pdf", authMW(http.HandlerFunc(timeTracker.DownloadPDF)))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string;
  address: string;
  phone: string;
  notes: string;
  hourly_rate: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export type ClientInput = Pick<
  Client,
  "name" | "email" | "company" | "address" | "phone" | "notes" | "hourly_rate" | "currency"
>;

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string;
  color: string;
  hourly_rate: number | null;
  budget_hours: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectInput = Pick<
  Project,
  "client_id" | "title" | "description" | "color" | "hourly_rate" | "budget_hours"
>;

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  description: string;
  start_time: string;
  end_time: string | null;
  duration: number;          // seconds
  is_billable: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type TimeEntryInput = Pick<
  TimeEntry,
  "project_id" | "description" | "start_time" | "end_time" | "duration" | "is_billable" | "tags"
>;

export interface InvoiceLineItem {
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes: string;
  line_items: InvoiceLineItem[];
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceInput = Pick<
  Invoice,
  "client_id" | "due_date" | "tax_rate" | "currency" | "notes" | "line_items"
>;

export interface TimeReport {
  total_hours: number;
  billable_hours: number;
  total_amount: number;
  by_project: { project_id: string; project_name: string; color: string; hours: number; amount: number }[];
  by_day: { date: string; hours: number }[];
}
```

## Service Functions

```ts
// lib/services/time-tracker.ts

import { api } from "@/lib/api/client";
import type { Client, ClientInput, Project, ProjectInput, TimeEntry, TimeEntryInput, Invoice, InvoiceInput, TimeReport } from "@/lib/types/database";

// Clients
export async function getClients(): Promise<Client[]> { return api.get("/api/clients"); }
export async function createClient(input: ClientInput): Promise<Client> { return api.post("/api/clients", input); }
export async function updateClient(id: string, input: ClientInput): Promise<Client> { return api.put(`/api/clients/${id}`, input); }
export async function deleteClient(id: string): Promise<void> { await api.delete(`/api/clients/${id}`); }

// Projects
export async function getProjects(): Promise<Project[]> { return api.get("/api/projects"); }
export async function createProject(input: ProjectInput): Promise<Project> { return api.post("/api/projects", input); }
export async function updateProject(id: string, input: ProjectInput): Promise<Project> { return api.put(`/api/projects/${id}`, input); }
export async function archiveProject(id: string): Promise<void> { await api.patch(`/api/projects/${id}/archive`); }
export async function deleteProject(id: string): Promise<void> { await api.delete(`/api/projects/${id}`); }

// Time entries
export async function getTimeEntries(params?: { project_id?: string; from?: string; to?: string }): Promise<TimeEntry[]> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return api.get(`/api/time-entries${query ? `?${query}` : ""}`);
}
export async function getRunningEntry(): Promise<TimeEntry | null> { return api.get("/api/time-entries/running"); }
export async function startTimer(input: { project_id: string; description: string }): Promise<TimeEntry> {
  return api.post("/api/time-entries/start", input);
}
export async function stopTimer(id: string): Promise<TimeEntry> { return api.post(`/api/time-entries/${id}/stop`, {}); }
export async function createEntry(input: TimeEntryInput): Promise<TimeEntry> { return api.post("/api/time-entries", input); }
export async function updateEntry(id: string, input: TimeEntryInput): Promise<TimeEntry> { return api.put(`/api/time-entries/${id}`, input); }
export async function deleteEntry(id: string): Promise<void> { await api.delete(`/api/time-entries/${id}`); }

// Reports
export async function getTimeReport(from: string, to: string): Promise<TimeReport> {
  return api.get(`/api/time-entries/report?from=${from}&to=${to}`);
}

// Invoices
export async function getInvoices(): Promise<Invoice[]> { return api.get("/api/invoices"); }
export async function getInvoice(id: string): Promise<Invoice> { return api.get(`/api/invoices/${id}`); }
export async function createInvoice(input: InvoiceInput): Promise<Invoice> { return api.post("/api/invoices", input); }
export async function updateInvoice(id: string, input: InvoiceInput): Promise<Invoice> { return api.put(`/api/invoices/${id}`, input); }
export async function updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
  return api.patch(`/api/invoices/${id}/status`, { status });
}
export async function deleteInvoice(id: string): Promise<void> { await api.delete(`/api/invoices/${id}`); }
export function getInvoicePdfUrl(id: string): string { return `/api/invoices/${id}/pdf`; }
```

## Hook

```ts
// hooks/use-time-tracker.ts

export function useTimeTracker() {
  return {
    // Clients
    clients: Client[];
    createClient, updateClient, deleteClient;

    // Projects
    projects: Project[];
    createProject, updateProject, archiveProject, deleteProject;

    // Timer
    runningEntry: TimeEntry | null;
    startTimer: (projectId: string, description: string) => Promise<void>;
    stopTimer: () => Promise<void>;
    elapsed: number;           // live seconds counter for running timer

    // Time entries
    entries: TimeEntry[];
    createEntry, updateEntry, deleteEntry;

    // Reports
    report: TimeReport | null;
    reportRange: { from: string; to: string };
    setReportRange, fetchReport;

    // Invoices
    invoices: Invoice[];
    createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice;

    loading, error, refetch;
  };
}
```

## Components

### TimerBar — Persistent floating timer widget at top of page

### ClientCard / ClientForm — CRUD for clients

### ProjectCard / ProjectForm — CRUD for projects with color, client link, budget

### TimeEntryRow / TimeEntryForm — Table row for time entries, inline edit

### TimeReport — Recharts bar chart (hours/day) + pie chart (hours/project)

### InvoiceCard / InvoiceForm — CRUD for invoices with line items editor

### InvoicePreview — Preview invoice before PDF download

### Skeleton — Loading states for all views

## Page Layout

```
app/(app)/time-tracker/page.tsx
```

Main page with tabs:

```
┌────────────────────────────────────────────────────────────────────┐
│ Time Tracker                                                        │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ 🔴 Working on: API refactor (Project Alpha)    01:23:45 [■] │   │
│ └──────────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────────┤
│  Timer │ Entries │ Reports │ Invoices │ Clients │ Projects         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Timer Tab:                                                        │
│  [Project ▼]  [Description...          ]  [▶ Start]               │
│                                                                    │
│  Today                                              Total: 4h 30m │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ Project Alpha  │ API refactor     │ 1:23:45 │ $ │ [✎] │       │
│  │ Project Alpha  │ Fix auth bug     │ 0:45:00 │ $ │ [✎] │       │
│  │ Side Project   │ Setup CI         │ 2:22:00 │   │ [✎] │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                    │
│  Reports Tab:                                                      │
│  [This Week ▼]  [2026-02-22] → [2026-02-28]                      │
│  ┌─────────────────────┐  ┌────────────────────┐                  │
│  │ Hours by Day (bar)  │  │ By Project (pie)   │                  │
│  │  █                  │  │    ╭────╮          │                  │
│  │  █ █                │  │   ╱ Alpha ╲        │                  │
│  │  █ █ █   █          │  │  │  Side   │       │                  │
│  │  M T W T F S S      │  │   ╲       ╱        │                  │
│  └─────────────────────┘  └────────────────────┘                  │
│  Total: 32h │ Billable: 28h │ Amount: $2,800                     │
│                                                                    │
│  Invoices Tab:                                                     │
│  [+ New Invoice]  [Status ▼]                                      │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ INV-2026-003 │ Acme Corp │ $2,800 │ Sent    │ [PDF] │         │
│  │ INV-2026-002 │ Acme Corp │ $1,400 │ Paid ✓  │ [PDF] │         │
│  │ INV-2026-001 │ StartupX  │ $3,200 │ Overdue │ [PDF] │         │
│  └────────────────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────────────────┘
```

## Navigation

```ts
import { Clock } from "lucide-react";

{
  title: "Time Tracker",
  href: "/time-tracker",
  icon: Clock,
}
```

## npm Packages

```bash
npm install recharts
# PDF generation happens server-side in Go — no frontend PDF package needed
```

## Logic Notes

### Running Timer

- Only ONE timer can run at a time (enforced by `GetRunning` check)
- Frontend polls or uses `setInterval` to update elapsed display
- `elapsed = Math.floor((Date.now() - new Date(runningEntry.start_time).getTime()) / 1000)`
- On stop: backend computes `duration` and sets `end_time`

### PDF Generation (Go)

Use `jung-kurt/gofpdf` or `signintech/gopdf` for server-side PDF generation:
- Company logo (optional, from profile avatar)
- Invoice number, dates, client details
- Line items table: description, hours, rate, amount
- Subtotal, tax, total
- Notes section
- Returns `application/pdf` with `Content-Disposition: attachment`

### Report Aggregation SQL

```sql
-- Hours by project
SELECT p.id, p.title, p.color,
       SUM(te.duration) / 3600.0 AS hours,
       SUM(CASE WHEN te.is_billable THEN te.duration / 3600.0 * COALESCE(p.hourly_rate, c.hourly_rate, 0) ELSE 0 END) AS amount
FROM time_entries te
JOIN projects p ON p.id = te.project_id
LEFT JOIN clients c ON c.id = p.client_id
WHERE te.user_id = $1 AND te.start_time BETWEEN $2 AND $3
GROUP BY p.id, p.title, p.color;

-- Hours by day
SELECT DATE(start_time) AS date, SUM(duration) / 3600.0 AS hours
FROM time_entries
WHERE user_id = $1 AND start_time BETWEEN $2 AND $3
GROUP BY DATE(start_time)
ORDER BY date;
```

### Invoice Auto-Generate from Time Entries

When creating an invoice, the frontend can:
1. Select a client + date range
2. Fetch billable time entries for that client's projects
3. Group by project → auto-fill line items (project name, total hours, rate, amount)
4. User can edit line items before saving
