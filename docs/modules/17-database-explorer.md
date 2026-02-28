# Module 17 — Database Explorer

> Difficulty: ⭐⭐⭐⭐ | Three new tables | No new packages (frontend) | Go: pgx for dynamic connections

## Overview

A web-based database management tool that lets users save database connections, browse table schemas, run SQL queries with syntax highlighting, and view results in a table format. Query history is saved and can be bookmarked. Includes an auto-generated ERD diagram from the schema. Supports PostgreSQL and MySQL connections (via Go's `database/sql` with appropriate drivers).

## Security Considerations

- **Connection credentials are encrypted** at rest using AES-256-GCM (reuse Env Vault's secret pattern)
- **Query execution has timeouts** (default 30s, max 60s) to prevent runaway queries
- **Read-only mode option** — connections can be marked read-only, which wraps queries in a read-only transaction
- **Dangerous query detection** — warn on DROP, DELETE without WHERE, TRUNCATE (frontend + backend validation)
- Connections are per-user and never shared

## PostgreSQL Migration

```sql
-- backend/database/migrations/021_create_database_explorer.up.sql

CREATE TABLE IF NOT EXISTS db_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    db_type TEXT NOT NULL DEFAULT 'postgresql' CHECK (db_type IN ('postgresql', 'mysql')),
    host TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 5432,
    database_name TEXT NOT NULL,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL DEFAULT '',   -- AES-256-GCM encrypted
    ssl_mode TEXT NOT NULL DEFAULT 'disable',
    is_read_only BOOLEAN NOT NULL DEFAULT false,
    color TEXT NOT NULL DEFAULT '#6b7280',
    last_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES db_connections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    query TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES db_connections(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    row_count INTEGER,
    execution_time_ms INTEGER,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
    error_message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_db_connections_user_id ON db_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_queries_user_id ON saved_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_queries_connection_id ON saved_queries(connection_id);
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_connection_id ON query_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON query_history(created_at DESC);
```

## Go Backend

### Model

```go
// backend/models/database_explorer.go

type DBConnection struct {
    ID                uuid.UUID  `json:"id"`
    UserID            uuid.UUID  `json:"user_id"`
    Name              string     `json:"name"`
    DBType            string     `json:"db_type"`
    Host              string     `json:"host"`
    Port              int        `json:"port"`
    DatabaseName      string     `json:"database_name"`
    Username          string     `json:"username"`
    PasswordEncrypted string     `json:"-"`                // never sent to frontend
    SSLMode           string     `json:"ssl_mode"`
    IsReadOnly        bool       `json:"is_read_only"`
    Color             string     `json:"color"`
    LastConnectedAt   *time.Time `json:"last_connected_at"`
    CreatedAt         time.Time  `json:"created_at"`
    UpdatedAt         time.Time  `json:"updated_at"`
}

type DBConnectionInput struct {
    Name         string `json:"name"`
    DBType       string `json:"db_type"`
    Host         string `json:"host"`
    Port         int    `json:"port"`
    DatabaseName string `json:"database_name"`
    Username     string `json:"username"`
    Password     string `json:"password"`      // plaintext from frontend, encrypted before storage
    SSLMode      string `json:"ssl_mode"`
    IsReadOnly   bool   `json:"is_read_only"`
    Color        string `json:"color"`
}

type TableInfo struct {
    Name       string       `json:"name"`
    Schema     string       `json:"schema"`
    Type       string       `json:"type"`       // "table" | "view"
    RowCount   int64        `json:"row_count"`
    Columns    []ColumnInfo `json:"columns"`
}

type ColumnInfo struct {
    Name         string  `json:"name"`
    DataType     string  `json:"data_type"`
    IsNullable   bool    `json:"is_nullable"`
    DefaultValue *string `json:"default_value"`
    IsPrimaryKey bool    `json:"is_primary_key"`
    IsForeignKey bool    `json:"is_foreign_key"`
    ForeignTable *string `json:"foreign_table,omitempty"`
    ForeignCol   *string `json:"foreign_column,omitempty"`
}

type ForeignKeyInfo struct {
    SourceTable  string `json:"source_table"`
    SourceColumn string `json:"source_column"`
    TargetTable  string `json:"target_table"`
    TargetColumn string `json:"target_column"`
}

type QueryRequest struct {
    ConnectionID string `json:"connection_id"`
    Query        string `json:"query"`
    Limit        int    `json:"limit"`     // default 100, max 1000
    TimeoutSec   int    `json:"timeout"`   // default 30, max 60
}

type QueryResult struct {
    Columns       []string        `json:"columns"`
    Rows          [][]interface{} `json:"rows"`
    RowCount      int             `json:"row_count"`
    AffectedRows  int64           `json:"affected_rows"`
    ExecutionTime int             `json:"execution_time_ms"`
    Truncated     bool            `json:"truncated"` // true if more rows exist than limit
}

type SavedQuery struct {
    ID           uuid.UUID  `json:"id"`
    UserID       uuid.UUID  `json:"user_id"`
    ConnectionID *uuid.UUID `json:"connection_id"`
    Title        string     `json:"title"`
    Query        string     `json:"query"`
    Description  string     `json:"description"`
    Tags         []string   `json:"tags"`
    IsFavorite   bool       `json:"is_favorite"`
    LastRunAt    *time.Time `json:"last_run_at"`
    CreatedAt    time.Time  `json:"created_at"`
    UpdatedAt    time.Time  `json:"updated_at"`
}

type SavedQueryInput struct {
    ConnectionID *uuid.UUID `json:"connection_id"`
    Title        string     `json:"title"`
    Query        string     `json:"query"`
    Description  string     `json:"description"`
    Tags         []string   `json:"tags"`
    IsFavorite   bool       `json:"is_favorite"`
}

type QueryHistoryEntry struct {
    ID            uuid.UUID `json:"id"`
    UserID        uuid.UUID `json:"user_id"`
    ConnectionID  uuid.UUID `json:"connection_id"`
    Query         string    `json:"query"`
    RowCount      *int      `json:"row_count"`
    ExecutionTime *int      `json:"execution_time_ms"`
    Status        string    `json:"status"`
    ErrorMessage  string    `json:"error_message"`
    CreatedAt     time.Time `json:"created_at"`
}

// ERD
type ERDiagram struct {
    Tables       []ERDTable       `json:"tables"`
    Relationships []ERDRelationship `json:"relationships"`
}

type ERDTable struct {
    Name    string       `json:"name"`
    Schema  string       `json:"schema"`
    Columns []ColumnInfo `json:"columns"`
}

type ERDRelationship struct {
    Source       string `json:"source"`       // table.column
    Target       string `json:"target"`       // table.column
    Type         string `json:"type"`         // "one-to-many", "one-to-one"
}
```

### Connection Manager

```go
// backend/engine/connection_manager.go

type ConnectionManager struct {
    pool       *pgxpool.Pool       // DevPulse's own DB (for reading connection config)
    conns      map[string]*sql.DB  // cached external connections (conn_id → *sql.DB)
    mu         sync.RWMutex
    encryptKey []byte              // AES key derived from SESSION_SECRET
}

func (m *ConnectionManager) GetConnection(ctx, connConfig *DBConnection) (*sql.DB, error)
// 1. Check cache by connection ID
// 2. If not cached, decrypt password
// 3. Build DSN based on db_type (postgresql:// or mysql://)
// 4. Open connection with sql.Open
// 5. Verify with Ping()
// 6. Cache and return
// 7. Connections auto-close after 10 minutes idle

func (m *ConnectionManager) CloseConnection(connID string)
func (m *ConnectionManager) TestConnection(ctx, input DBConnectionInput) error
// Opens temporary connection, pings, closes immediately

func (m *ConnectionManager) Encrypt(plaintext string) (string, error)
func (m *ConnectionManager) Decrypt(ciphertext string) (string, error)
// AES-256-GCM encryption for passwords
```

### Handler

```go
// backend/handlers/database_explorer.go

type DatabaseExplorerHandler struct {
    connRepo    *DBConnectionRepo
    queryRepo   *SavedQueryRepo
    historyRepo *QueryHistoryRepo
    connMgr     *ConnectionManager
}

// Connections
func (h *DatabaseExplorerHandler) ListConnections(w, r)     // GET    /api/db-explorer/connections
func (h *DatabaseExplorerHandler) CreateConnection(w, r)     // POST   /api/db-explorer/connections
func (h *DatabaseExplorerHandler) UpdateConnection(w, r)     // PUT    /api/db-explorer/connections/{id}
func (h *DatabaseExplorerHandler) DeleteConnection(w, r)     // DELETE /api/db-explorer/connections/{id}
func (h *DatabaseExplorerHandler) TestConnection(w, r)       // POST   /api/db-explorer/connections/test

// Schema browsing
func (h *DatabaseExplorerHandler) GetTables(w, r)            // GET    /api/db-explorer/connections/{id}/tables
func (h *DatabaseExplorerHandler) GetTableDetail(w, r)       // GET    /api/db-explorer/connections/{id}/tables/{table}
func (h *DatabaseExplorerHandler) GetERD(w, r)               // GET    /api/db-explorer/connections/{id}/erd

// Query execution
func (h *DatabaseExplorerHandler) ExecuteQuery(w, r)         // POST   /api/db-explorer/query
// 1. Validate connection belongs to user
// 2. Check for dangerous queries if read_only
// 3. Open connection via ConnectionManager
// 4. If read_only: SET TRANSACTION READ ONLY
// 5. Execute with context timeout
// 6. Parse results into QueryResult
// 7. Save to query_history
// 8. Return results

func (h *DatabaseExplorerHandler) ExportResults(w, r)        // POST   /api/db-explorer/export
// Returns CSV or JSON file of query results

// Saved queries
func (h *DatabaseExplorerHandler) ListSavedQueries(w, r)     // GET    /api/db-explorer/queries
func (h *DatabaseExplorerHandler) CreateSavedQuery(w, r)     // POST   /api/db-explorer/queries
func (h *DatabaseExplorerHandler) UpdateSavedQuery(w, r)     // PUT    /api/db-explorer/queries/{id}
func (h *DatabaseExplorerHandler) DeleteSavedQuery(w, r)     // DELETE /api/db-explorer/queries/{id}

// History
func (h *DatabaseExplorerHandler) GetHistory(w, r)           // GET    /api/db-explorer/history
func (h *DatabaseExplorerHandler) ClearHistory(w, r)         // DELETE /api/db-explorer/history
```

### Routes

```go
// Add to backend/router/router.go

// Connections
mux.Handle("GET /api/db-explorer/connections", authMW(http.HandlerFunc(dbExplorer.ListConnections)))
mux.Handle("POST /api/db-explorer/connections", authMW(http.HandlerFunc(dbExplorer.CreateConnection)))
mux.Handle("PUT /api/db-explorer/connections/{id}", authMW(http.HandlerFunc(dbExplorer.UpdateConnection)))
mux.Handle("DELETE /api/db-explorer/connections/{id}", authMW(http.HandlerFunc(dbExplorer.DeleteConnection)))
mux.Handle("POST /api/db-explorer/connections/test", authMW(http.HandlerFunc(dbExplorer.TestConnection)))

// Schema
mux.Handle("GET /api/db-explorer/connections/{id}/tables", authMW(http.HandlerFunc(dbExplorer.GetTables)))
mux.Handle("GET /api/db-explorer/connections/{id}/tables/{table}", authMW(http.HandlerFunc(dbExplorer.GetTableDetail)))
mux.Handle("GET /api/db-explorer/connections/{id}/erd", authMW(http.HandlerFunc(dbExplorer.GetERD)))

// Query
mux.Handle("POST /api/db-explorer/query", authMW(http.HandlerFunc(dbExplorer.ExecuteQuery)))
mux.Handle("POST /api/db-explorer/export", authMW(http.HandlerFunc(dbExplorer.ExportResults)))

// Saved queries
mux.Handle("GET /api/db-explorer/queries", authMW(http.HandlerFunc(dbExplorer.ListSavedQueries)))
mux.Handle("POST /api/db-explorer/queries", authMW(http.HandlerFunc(dbExplorer.CreateSavedQuery)))
mux.Handle("PUT /api/db-explorer/queries/{id}", authMW(http.HandlerFunc(dbExplorer.UpdateSavedQuery)))
mux.Handle("DELETE /api/db-explorer/queries/{id}", authMW(http.HandlerFunc(dbExplorer.DeleteSavedQuery)))

// History
mux.Handle("GET /api/db-explorer/history", authMW(http.HandlerFunc(dbExplorer.GetHistory)))
mux.Handle("DELETE /api/db-explorer/history", authMW(http.HandlerFunc(dbExplorer.ClearHistory)))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface DBConnection {
  id: string;
  user_id: string;
  name: string;
  db_type: "postgresql" | "mysql";
  host: string;
  port: number;
  database_name: string;
  username: string;
  // password is NEVER returned from API
  ssl_mode: string;
  is_read_only: boolean;
  color: string;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBConnectionInput {
  name: string;
  db_type: "postgresql" | "mysql";
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  ssl_mode: string;
  is_read_only: boolean;
  color: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  type: "table" | "view";
  row_count: number;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  is_nullable: boolean;
  default_value: string | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_table?: string;
  foreign_column?: string;
}

export interface QueryRequest {
  connection_id: string;
  query: string;
  limit?: number;
  timeout?: number;
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  affected_rows: number;
  execution_time_ms: number;
  truncated: boolean;
}

export interface SavedQuery {
  id: string;
  user_id: string;
  connection_id: string | null;
  title: string;
  query: string;
  description: string;
  tags: string[];
  is_favorite: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SavedQueryInput = Pick<
  SavedQuery,
  "connection_id" | "title" | "query" | "description" | "tags" | "is_favorite"
>;

export interface QueryHistoryEntry {
  id: string;
  connection_id: string;
  query: string;
  row_count: number | null;
  execution_time_ms: number | null;
  status: "success" | "error";
  error_message: string;
  created_at: string;
}

export interface ERDiagram {
  tables: { name: string; schema: string; columns: ColumnInfo[] }[];
  relationships: { source: string; target: string; type: string }[];
}
```

## Service Functions

```ts
// lib/services/database-explorer.ts

import { api } from "@/lib/api/client";
import type {
  DBConnection, DBConnectionInput, TableInfo, ColumnInfo,
  QueryRequest, QueryResult,
  SavedQuery, SavedQueryInput,
  QueryHistoryEntry, ERDiagram,
} from "@/lib/types/database";

// Connections
export async function getConnections(): Promise<DBConnection[]> { return api.get("/api/db-explorer/connections"); }
export async function createConnection(input: DBConnectionInput): Promise<DBConnection> { return api.post("/api/db-explorer/connections", input); }
export async function updateConnection(id: string, input: DBConnectionInput): Promise<DBConnection> { return api.put(`/api/db-explorer/connections/${id}`, input); }
export async function deleteConnection(id: string): Promise<void> { await api.delete(`/api/db-explorer/connections/${id}`); }
export async function testConnection(input: DBConnectionInput): Promise<{ success: boolean; error?: string }> {
  return api.post("/api/db-explorer/connections/test", input);
}

// Schema
export async function getTables(connId: string): Promise<TableInfo[]> { return api.get(`/api/db-explorer/connections/${connId}/tables`); }
export async function getTableDetail(connId: string, table: string): Promise<TableInfo> {
  return api.get(`/api/db-explorer/connections/${connId}/tables/${table}`);
}
export async function getERD(connId: string): Promise<ERDiagram> { return api.get(`/api/db-explorer/connections/${connId}/erd`); }

// Query
export async function executeQuery(req: QueryRequest): Promise<QueryResult> {
  return api.post("/api/db-explorer/query", req, { timeout: 65000 });
}
export async function exportResults(req: QueryRequest & { format: "csv" | "json" }): Promise<Blob> {
  const res = await fetch("/api/db-explorer/export", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req), credentials: "include",
  });
  return res.blob();
}

// Saved queries
export async function getSavedQueries(): Promise<SavedQuery[]> { return api.get("/api/db-explorer/queries"); }
export async function createSavedQuery(input: SavedQueryInput): Promise<SavedQuery> { return api.post("/api/db-explorer/queries", input); }
export async function updateSavedQuery(id: string, input: SavedQueryInput): Promise<SavedQuery> { return api.put(`/api/db-explorer/queries/${id}`, input); }
export async function deleteSavedQuery(id: string): Promise<void> { await api.delete(`/api/db-explorer/queries/${id}`); }

// History
export async function getQueryHistory(): Promise<QueryHistoryEntry[]> { return api.get("/api/db-explorer/history"); }
export async function clearQueryHistory(): Promise<void> { await api.delete("/api/db-explorer/history"); }
```

## Components

### ConnectionCard / ConnectionForm — CRUD for database connections with test button

### SchemaTree — Left sidebar showing tables/views in tree structure, click to expand columns

### QueryEditor — SQL editor with syntax highlighting (Shiki), keyboard shortcut Ctrl+Enter to execute

### ResultsTable — Data grid showing query results with sortable columns, copy cell, pagination

### QueryHistoryPanel — Searchable list of past queries, click to load into editor

### SavedQueryCard / SavedQueryForm — Bookmark queries with title, tags, favorites

### ERDViewer — Visual entity-relationship diagram (can reuse @xyflow/react from workflows, or simple SVG)

### DangerQueryWarning — Alert dialog when user attempts DROP/DELETE/TRUNCATE

### Skeleton — Loading states for all panels

## Page Layout

```
app/(app)/db-explorer/page.tsx
```

```
┌────────────────────────────────────────────────────────────────────┐
│ Database Explorer            [Connection: Production DB ▼] [+ New] │
├──────────────┬─────────────────────────────────────────────────────┤
│ Schema       │ Query Editor                                        │
│              │ ┌───────────────────────────────────────────────┐   │
│ ▼ Tables (12)│ │ SELECT u.id, u.email, p.display_name         │   │
│   users      │ │ FROM users u                                  │   │
│   profiles   │ │ JOIN profiles p ON p.id = u.id                │   │
│   snippets   │ │ WHERE u.created_at > '2026-01-01'             │   │
│   sessions   │ │ ORDER BY u.created_at DESC                    │   │
│   ...        │ │ LIMIT 50;                                     │   │
│              │ └───────────────────────────────────────────────┘   │
│ ▶ Views (3)  │ [▶ Run (Ctrl+Enter)] [💾 Save] [📋 Export CSV]    │
│              │                                                     │
│ ── Saved ──  │ Results ── 50 rows ── 12ms ── Read Only 🔒        │
│ ★ User stats │ ┌──────┬──────────────┬───────────────────┐       │
│   Monthly rpt│ │ id   │ email        │ display_name      │       │
│              │ ├──────┼──────────────┼───────────────────┤       │
│ ── History ──│ │ a1b2 │ alice@...    │ Alice             │       │
│ SELECT * FR..│ │ c3d4 │ bob@...      │ Bob               │       │
│ UPDATE user..│ │ e5f6 │ charlie@...  │ Charlie           │       │
│ SELECT COUN..|│ │ ...  │ ...          │ ...               │       │
│              │ └──────┴──────────────┴───────────────────┘       │
│              │ ← 1 2 3 4 5 →                                      │
├──────────────┴─────────────────────────────────────────────────────┤
│ [ERD Diagram]                                                      │
└────────────────────────────────────────────────────────────────────┘
```

- 3-panel layout: schema sidebar (left), query editor (top-right), results (bottom-right)
- Bottom-left sidebar sections: schema tree, saved queries, query history

## Navigation

```ts
import { Database } from "lucide-react";

{
  title: "DB Explorer",
  href: "/db-explorer",
  icon: Database,
}
```

## npm Packages

None needed (uses existing Shiki for SQL highlighting).

Optional: `@xyflow/react` if you want the ERD to be interactive (shared with workflow module).

## Logic Notes

### Schema Introspection SQL (PostgreSQL)

```sql
-- List tables
SELECT table_name, table_type,
  (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name) as row_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- List columns for a table
SELECT c.column_name, c.data_type, c.is_nullable, c.column_default,
  EXISTS (SELECT 1 FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc ON tc.constraint_name = kcu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
          AND kcu.column_name = c.column_name AND kcu.table_name = c.table_name) as is_primary_key
FROM information_schema.columns c
WHERE c.table_name = $1 AND c.table_schema = 'public'
ORDER BY c.ordinal_position;

-- Foreign keys
SELECT
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column
FROM information_schema.key_column_usage kcu
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = kcu.constraint_name
JOIN information_schema.table_constraints tc ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.table_name = $1;
```

### Schema Introspection SQL (MySQL)

```sql
-- List tables
SELECT TABLE_NAME, TABLE_TYPE, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- Columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
ORDER BY ORDINAL_POSITION;

-- Foreign keys
SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### Dangerous Query Detection

```go
var dangerousPatterns = []string{
    `(?i)^\s*DROP\s+`,
    `(?i)^\s*TRUNCATE\s+`,
    `(?i)^\s*DELETE\s+FROM\s+\w+\s*$`,  // DELETE without WHERE
    `(?i)^\s*ALTER\s+TABLE\s+.*\s+DROP\s+`,
}

func isDangerousQuery(query string) (bool, string) {
    for _, pattern := range dangerousPatterns {
        if matched, _ := regexp.MatchString(pattern, query); matched {
            return true, "This query may cause data loss. Are you sure?"
        }
    }
    return false, ""
}
```

### Read-Only Enforcement

```go
if conn.IsReadOnly {
    // Wrap in read-only transaction
    tx, _ := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
    defer tx.Rollback()
    rows, err = tx.QueryContext(ctx, query)
} else {
    rows, err = db.QueryContext(ctx, query)
}
```

### Password Encryption

Reuse the same AES-256-GCM pattern as Env Vault's `is_secret` fields. Derive the encryption key from `SESSION_SECRET` environment variable using SHA-256.

### ERD Auto-Generation

1. Fetch all tables + columns + foreign keys for the connection
2. Build `ERDiagram` struct with tables and relationships
3. Frontend renders using either:
   - Simple SVG with positioned boxes and arrows
   - @xyflow/react for interactive draggable diagram
4. Relationships are derived from foreign key constraints

### Connection Pooling

The `ConnectionManager` caches `*sql.DB` instances per connection ID. Each has:
- `SetMaxOpenConns(5)` — limit concurrent queries per connection
- `SetMaxIdleConns(1)` — keep 1 idle conn
- `SetConnMaxIdleTime(10 * time.Minute)` — auto-close after 10min idle
- A cleanup goroutine removes stale entries from the cache
