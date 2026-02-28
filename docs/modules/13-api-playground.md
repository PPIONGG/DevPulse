# Module 13 — API Playground

> Difficulty: ⭐⭐⭐⭐ | Three new tables | No new packages

## Overview

A built-in API testing tool (mini Postman) for sending HTTP requests, organizing them into collections, and viewing responses with syntax highlighting. Integrates with the existing Env Vault module to inject environment variables (e.g., `{{BASE_URL}}`, `{{API_KEY}}`) into URLs, headers, and body. All requests are proxied through the Go backend to bypass CORS restrictions.

## PostgreSQL Migration

```sql
-- backend/database/migrations/017_create_api_playground.up.sql

CREATE TABLE IF NOT EXISTS api_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES api_collections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')),
    url TEXT NOT NULL DEFAULT '',
    headers JSONB NOT NULL DEFAULT '[]',       -- [{key, value, enabled}]
    query_params JSONB NOT NULL DEFAULT '[]',  -- [{key, value, enabled}]
    body_type TEXT NOT NULL DEFAULT 'none' CHECK (body_type IN ('none', 'json', 'form', 'raw')),
    body TEXT NOT NULL DEFAULT '',
    env_vault_id UUID REFERENCES env_vaults(id) ON DELETE SET NULL, -- linked env vault for variable substitution
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_request_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES api_requests(id) ON DELETE SET NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    request_headers JSONB NOT NULL DEFAULT '{}',
    request_body TEXT NOT NULL DEFAULT '',
    response_status INTEGER NOT NULL,
    response_headers JSONB NOT NULL DEFAULT '{}',
    response_body TEXT NOT NULL DEFAULT '',
    response_size INTEGER NOT NULL DEFAULT 0,      -- bytes
    response_time INTEGER NOT NULL DEFAULT 0,      -- milliseconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_collections_user_id ON api_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_collection_id ON api_requests(collection_id);
CREATE INDEX IF NOT EXISTS idx_api_request_history_user_id ON api_request_history(user_id);
CREATE INDEX IF NOT EXISTS idx_api_request_history_created_at ON api_request_history(created_at DESC);
```

## Go Backend

### Model

```go
// backend/models/api_playground.go

type ApiCollection struct {
    ID          uuid.UUID `json:"id"`
    UserID      uuid.UUID `json:"user_id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    IsFavorite  bool      `json:"is_favorite"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type ApiCollectionInput struct {
    Title       string `json:"title"`
    Description string `json:"description"`
    IsFavorite  bool   `json:"is_favorite"`
}

type KeyValuePair struct {
    Key     string `json:"key"`
    Value   string `json:"value"`
    Enabled bool   `json:"enabled"`
}

type ApiRequest struct {
    ID           uuid.UUID      `json:"id"`
    UserID       uuid.UUID      `json:"user_id"`
    CollectionID *uuid.UUID     `json:"collection_id"`
    Title        string         `json:"title"`
    Method       string         `json:"method"`
    URL          string         `json:"url"`
    Headers      []KeyValuePair `json:"headers"`
    QueryParams  []KeyValuePair `json:"query_params"`
    BodyType     string         `json:"body_type"`
    Body         string         `json:"body"`
    EnvVaultID   *uuid.UUID     `json:"env_vault_id"`
    SortOrder    int            `json:"sort_order"`
    CreatedAt    time.Time      `json:"created_at"`
    UpdatedAt    time.Time      `json:"updated_at"`
}

type ApiRequestInput struct {
    CollectionID *uuid.UUID     `json:"collection_id"`
    Title        string         `json:"title"`
    Method       string         `json:"method"`
    URL          string         `json:"url"`
    Headers      []KeyValuePair `json:"headers"`
    QueryParams  []KeyValuePair `json:"query_params"`
    BodyType     string         `json:"body_type"`
    Body         string         `json:"body"`
    EnvVaultID   *uuid.UUID     `json:"env_vault_id"`
}

type ApiRequestHistory struct {
    ID              uuid.UUID         `json:"id"`
    UserID          uuid.UUID         `json:"user_id"`
    RequestID       *uuid.UUID        `json:"request_id"`
    Method          string            `json:"method"`
    URL             string            `json:"url"`
    RequestHeaders  map[string]string `json:"request_headers"`
    RequestBody     string            `json:"request_body"`
    ResponseStatus  int               `json:"response_status"`
    ResponseHeaders map[string]string `json:"response_headers"`
    ResponseBody    string            `json:"response_body"`
    ResponseSize    int               `json:"response_size"`
    ResponseTime    int               `json:"response_time"`
    CreatedAt       time.Time         `json:"created_at"`
}

// Proxy request — sent from frontend, executed by backend
type ProxyRequest struct {
    Method  string            `json:"method"`
    URL     string            `json:"url"`
    Headers map[string]string `json:"headers"`
    Body    string            `json:"body"`
}

type ProxyResponse struct {
    Status      int               `json:"status"`
    StatusText  string            `json:"status_text"`
    Headers     map[string]string `json:"headers"`
    Body        string            `json:"body"`
    Size        int               `json:"size"`
    TimeMs      int               `json:"time_ms"`
}
```

### Repository

```go
// backend/repository/api_playground_repo.go

type ApiCollectionRepo struct { pool *pgxpool.Pool }

func (r *ApiCollectionRepo) List(ctx, userID) ([]ApiCollection, error)
func (r *ApiCollectionRepo) Create(ctx, userID, input) (*ApiCollection, error)
func (r *ApiCollectionRepo) Update(ctx, userID, id, input) (*ApiCollection, error)
func (r *ApiCollectionRepo) Delete(ctx, userID, id) error

type ApiRequestRepo struct { pool *pgxpool.Pool }

func (r *ApiRequestRepo) List(ctx, userID) ([]ApiRequest, error)
func (r *ApiRequestRepo) ListByCollection(ctx, userID, collectionID) ([]ApiRequest, error)
func (r *ApiRequestRepo) GetByID(ctx, userID, id) (*ApiRequest, error)
func (r *ApiRequestRepo) Create(ctx, userID, input) (*ApiRequest, error)
func (r *ApiRequestRepo) Update(ctx, userID, id, input) (*ApiRequest, error)
func (r *ApiRequestRepo) Delete(ctx, userID, id) error
func (r *ApiRequestRepo) Duplicate(ctx, userID, id) (*ApiRequest, error)

type ApiHistoryRepo struct { pool *pgxpool.Pool }

func (r *ApiHistoryRepo) List(ctx, userID, limit) ([]ApiRequestHistory, error)
func (r *ApiHistoryRepo) Create(ctx, userID, history) (*ApiRequestHistory, error)
func (r *ApiHistoryRepo) Delete(ctx, userID, id) error
func (r *ApiHistoryRepo) ClearAll(ctx, userID) error
```

### Handler

```go
// backend/handlers/api_playground.go

type ApiPlaygroundHandler struct {
    collectionRepo *ApiCollectionRepo
    requestRepo    *ApiRequestRepo
    historyRepo    *ApiHistoryRepo
    envVaultRepo   *EnvVaultRepo       // for variable substitution
    envVarRepo     *EnvVariableRepo
    httpClient     *http.Client        // with configurable timeout
}

func (h *ApiPlaygroundHandler) ListCollections(w, r)   // GET    /api/api-playground/collections
func (h *ApiPlaygroundHandler) CreateCollection(w, r)   // POST   /api/api-playground/collections
func (h *ApiPlaygroundHandler) UpdateCollection(w, r)   // PUT    /api/api-playground/collections/{id}
func (h *ApiPlaygroundHandler) DeleteCollection(w, r)   // DELETE /api/api-playground/collections/{id}

func (h *ApiPlaygroundHandler) ListRequests(w, r)       // GET    /api/api-playground/requests
func (h *ApiPlaygroundHandler) GetRequest(w, r)         // GET    /api/api-playground/requests/{id}
func (h *ApiPlaygroundHandler) CreateRequest(w, r)      // POST   /api/api-playground/requests
func (h *ApiPlaygroundHandler) UpdateRequest(w, r)      // PUT    /api/api-playground/requests/{id}
func (h *ApiPlaygroundHandler) DeleteRequest(w, r)      // DELETE /api/api-playground/requests/{id}
func (h *ApiPlaygroundHandler) DuplicateRequest(w, r)   // POST   /api/api-playground/requests/{id}/duplicate

func (h *ApiPlaygroundHandler) SendRequest(w, r)        // POST   /api/api-playground/send
// The core proxy endpoint:
// 1. Parse ProxyRequest from body
// 2. If env_vault_id provided, resolve {{VAR}} templates in URL, headers, body
// 3. Execute HTTP request via h.httpClient (30s timeout)
// 4. Return ProxyResponse
// 5. Auto-save to history

func (h *ApiPlaygroundHandler) ListHistory(w, r)        // GET    /api/api-playground/history
func (h *ApiPlaygroundHandler) DeleteHistory(w, r)      // DELETE /api/api-playground/history/{id}
func (h *ApiPlaygroundHandler) ClearHistory(w, r)       // DELETE /api/api-playground/history

func (h *ApiPlaygroundHandler) ExportCurl(w, r)         // POST   /api/api-playground/export/curl
// Generates a cURL command string from a request definition
```

### Routes

```go
// Add to backend/router/router.go

mux.Handle("GET /api/api-playground/collections", authMW(http.HandlerFunc(apiPlayground.ListCollections)))
mux.Handle("POST /api/api-playground/collections", authMW(http.HandlerFunc(apiPlayground.CreateCollection)))
mux.Handle("PUT /api/api-playground/collections/{id}", authMW(http.HandlerFunc(apiPlayground.UpdateCollection)))
mux.Handle("DELETE /api/api-playground/collections/{id}", authMW(http.HandlerFunc(apiPlayground.DeleteCollection)))

mux.Handle("GET /api/api-playground/requests", authMW(http.HandlerFunc(apiPlayground.ListRequests)))
mux.Handle("GET /api/api-playground/requests/{id}", authMW(http.HandlerFunc(apiPlayground.GetRequest)))
mux.Handle("POST /api/api-playground/requests", authMW(http.HandlerFunc(apiPlayground.CreateRequest)))
mux.Handle("PUT /api/api-playground/requests/{id}", authMW(http.HandlerFunc(apiPlayground.UpdateRequest)))
mux.Handle("DELETE /api/api-playground/requests/{id}", authMW(http.HandlerFunc(apiPlayground.DeleteRequest)))
mux.Handle("POST /api/api-playground/requests/{id}/duplicate", authMW(http.HandlerFunc(apiPlayground.DuplicateRequest)))

mux.Handle("POST /api/api-playground/send", authMW(http.HandlerFunc(apiPlayground.SendRequest)))

mux.Handle("GET /api/api-playground/history", authMW(http.HandlerFunc(apiPlayground.ListHistory)))
mux.Handle("DELETE /api/api-playground/history/{id}", authMW(http.HandlerFunc(apiPlayground.DeleteHistory)))
mux.Handle("DELETE /api/api-playground/history", authMW(http.HandlerFunc(apiPlayground.ClearHistory)))

mux.Handle("POST /api/api-playground/export/curl", authMW(http.HandlerFunc(apiPlayground.ExportCurl)))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiCollection {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type ApiCollectionInput = Pick<ApiCollection, "title" | "description" | "is_favorite">;

export interface ApiRequest {
  id: string;
  user_id: string;
  collection_id: string | null;
  title: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  url: string;
  headers: KeyValuePair[];
  query_params: KeyValuePair[];
  body_type: "none" | "json" | "form" | "raw";
  body: string;
  env_vault_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ApiRequestInput = Pick<
  ApiRequest,
  "collection_id" | "title" | "method" | "url" | "headers" | "query_params" | "body_type" | "body" | "env_vault_id"
>;

export interface ApiRequestHistory {
  id: string;
  user_id: string;
  request_id: string | null;
  method: string;
  url: string;
  request_headers: Record<string, string>;
  request_body: string;
  response_status: number;
  response_headers: Record<string, string>;
  response_body: string;
  response_size: number;
  response_time: number;
  created_at: string;
}

export interface ProxyRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  env_vault_id?: string;
}

export interface ProxyResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  time_ms: number;
}
```

## Service Functions

```ts
// lib/services/api-playground.ts

import { api } from "@/lib/api/client";
import type {
  ApiCollection, ApiCollectionInput,
  ApiRequest, ApiRequestInput,
  ApiRequestHistory,
  ProxyRequest, ProxyResponse,
} from "@/lib/types/database";

// Collections
export async function getCollections(): Promise<ApiCollection[]> {
  return api.get<ApiCollection[]>("/api/api-playground/collections");
}
export async function createCollection(input: ApiCollectionInput): Promise<ApiCollection> {
  return api.post<ApiCollection>("/api/api-playground/collections", input);
}
export async function updateCollection(id: string, input: ApiCollectionInput): Promise<ApiCollection> {
  return api.put<ApiCollection>(`/api/api-playground/collections/${id}`, input);
}
export async function deleteCollection(id: string): Promise<void> {
  await api.delete(`/api/api-playground/collections/${id}`);
}

// Requests
export async function getRequests(): Promise<ApiRequest[]> {
  return api.get<ApiRequest[]>("/api/api-playground/requests");
}
export async function getRequest(id: string): Promise<ApiRequest> {
  return api.get<ApiRequest>(`/api/api-playground/requests/${id}`);
}
export async function createRequest(input: ApiRequestInput): Promise<ApiRequest> {
  return api.post<ApiRequest>("/api/api-playground/requests", input);
}
export async function updateRequest(id: string, input: ApiRequestInput): Promise<ApiRequest> {
  return api.put<ApiRequest>(`/api/api-playground/requests/${id}`, input);
}
export async function deleteRequest(id: string): Promise<void> {
  await api.delete(`/api/api-playground/requests/${id}`);
}
export async function duplicateRequest(id: string): Promise<ApiRequest> {
  return api.post<ApiRequest>(`/api/api-playground/requests/${id}/duplicate`, {});
}

// Send (proxy)
export async function sendRequest(req: ProxyRequest): Promise<ProxyResponse> {
  return api.post<ProxyResponse>("/api/api-playground/send", req, { timeout: 35000 });
}

// Export
export async function exportCurl(req: ProxyRequest): Promise<{ curl: string }> {
  return api.post<{ curl: string }>("/api/api-playground/export/curl", req);
}

// History
export async function getHistory(): Promise<ApiRequestHistory[]> {
  return api.get<ApiRequestHistory[]>("/api/api-playground/history");
}
export async function deleteHistoryItem(id: string): Promise<void> {
  await api.delete(`/api/api-playground/history/${id}`);
}
export async function clearHistory(): Promise<void> {
  await api.delete("/api/api-playground/history");
}
```

## Hook

```ts
// hooks/use-api-playground.ts

export function useApiPlayground() {
  return {
    // Collections
    collections: ApiCollection[];
    createCollection: (input: ApiCollectionInput) => Promise<ApiCollection | undefined>;
    updateCollection: (id: string, input: ApiCollectionInput) => Promise<void>;
    deleteCollection: (id: string) => Promise<void>;

    // Requests
    requests: ApiRequest[];
    selectedRequest: ApiRequest | null;
    selectRequest: (id: string | null) => void;
    createRequest: (input: ApiRequestInput) => Promise<ApiRequest | undefined>;
    updateRequest: (id: string, input: ApiRequestInput) => Promise<void>;
    deleteRequest: (id: string) => Promise<void>;
    duplicateRequest: (id: string) => Promise<void>;

    // Send & response
    sendRequest: (req: ProxyRequest) => Promise<void>;
    response: ProxyResponse | null;
    sending: boolean;

    // History
    history: ApiRequestHistory[];
    deleteHistoryItem: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;

    // General
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
  };
}
```

## Components

### ApiSidebar

```
components/api-sidebar.tsx
```

Left panel — tree view of collections and requests:
- Collapsible collection folders
- Request items with method badge (GET=green, POST=blue, PUT=orange, DELETE=red)
- Drag to reorder / move between collections
- Right-click context menu: rename, duplicate, delete, move to collection
- "New Request" / "New Collection" buttons at top
- Uncategorized requests shown at bottom

### ApiRequestEditor

```
components/api-request-editor.tsx
```

Main request builder:
- Method selector (dropdown) + URL input bar + "Send" button
- Env Vault selector (dropdown — pick which vault for variable substitution)
- Tabs: Params | Headers | Body | Auth
  - **Params tab:** Key-value table with enable/disable toggles
  - **Headers tab:** Key-value table with enable/disable toggles + common header autocomplete
  - **Body tab:** Body type selector (none/JSON/form/raw) + code editor (CodeBlock with editing)
  - **Auth tab:** Quick-add auth headers (Bearer token, Basic auth, API key)

### ApiResponseViewer

```
components/api-response-viewer.tsx
```

Response display panel:
- Status badge (200 OK green, 4xx yellow, 5xx red)
- Metadata bar: status code, response time (ms), response size (bytes/KB)
- Tabs: Body | Headers | Cookies
  - **Body tab:** Syntax-highlighted JSON/XML/HTML with copy button, word wrap toggle
  - **Headers tab:** Key-value table of response headers
  - **Cookies tab:** Parsed Set-Cookie headers

### ApiHistory

```
components/api-history.tsx
```

- Chronological list of past requests (grouped by date)
- Each entry: method badge, URL, status code, time
- Click to load into editor
- "Clear All" with confirmation

### Skeleton

```ts
// Add to components/skeletons.tsx

export function ApiPlaygroundSkeleton() {
  // 3-panel layout skeleton: sidebar + editor + response
}
```

## Page Layout

```
app/(app)/api-playground/page.tsx
```

```
┌──────────────────────────────────────────────────────────────────┐
│ API Playground                                                    │
├────────────┬─────────────────────────────────────────────────────┤
│ Collections│  [GET ▼] [https://api.example.com/users  ] [Send]  │
│            │  Vault: [Production ▼]                              │
│ ▼ Auth API │  ┌─────────────────────────────────────────────┐   │
│   GET /me  │  │ Params │ Headers │ Body │ Auth │             │   │
│   POST /lo │  ├─────────────────────────────────────────────┤   │
│   POST /re │  │ Key        │ Value         │ ☑ │             │   │
│            │  │ page       │ 1             │ ☑ │             │   │
│ ▼ Users    │  │ limit      │ {{PAGE_SIZE}} │ ☑ │             │   │
│   GET /use │  │ sort       │ created_at    │ ☐ │             │   │
│   POST /us │  │ [+ Add parameter]                           │   │
│   PUT /use │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│ ─ History  │  Response ── 200 OK ── 142ms ── 3.2 KB            │
│   GET /api │  ┌─────────────────────────────────────────────┐   │
│   POST /ap │  │ Body │ Headers │ Cookies │                   │   │
│            │  ├─────────────────────────────────────────────┤   │
│            │  │ {                                     [Copy] │   │
│ [+ Request]│  │   "users": [                                │   │
│ [+ Collect]│  │     { "id": 1, "name": "Alice" },          │   │
│            │  │     { "id": 2, "name": "Bob" }              │   │
│            │  │   ],                                        │   │
│            │  │   "total": 42                               │   │
│            │  │ }                                           │   │
│            │  └─────────────────────────────────────────────┘   │
├────────────┴─────────────────────────────────────────────────────┤
│ [Export as cURL]                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- 3-panel layout: sidebar (left), request editor (top-right), response (bottom-right)
- Resizable panels using CSS resize or drag handle
- Responsive: on mobile, sidebar becomes a sheet/drawer

## Navigation

```ts
// In config/navigation.ts
import { Send } from "lucide-react";

{
  title: "API Playground",
  href: "/api-playground",
  icon: Send,
}
```

## Config Files

```ts
// config/api-playground.ts

export const HTTP_METHODS = [
  { value: "GET", label: "GET", color: "text-green-500" },
  { value: "POST", label: "POST", color: "text-blue-500" },
  { value: "PUT", label: "PUT", color: "text-orange-500" },
  { value: "PATCH", label: "PATCH", color: "text-yellow-500" },
  { value: "DELETE", label: "DELETE", color: "text-red-500" },
  { value: "HEAD", label: "HEAD", color: "text-purple-500" },
  { value: "OPTIONS", label: "OPTIONS", color: "text-gray-500" },
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number]["value"];

export const BODY_TYPES = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "form", label: "Form Data" },
  { value: "raw", label: "Raw" },
] as const;

export const COMMON_HEADERS = [
  "Accept",
  "Authorization",
  "Content-Type",
  "Cache-Control",
  "User-Agent",
  "X-API-Key",
  "X-Request-ID",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  "2": "text-green-500",   // 2xx
  "3": "text-blue-500",    // 3xx
  "4": "text-yellow-500",  // 4xx
  "5": "text-red-500",     // 5xx
};
```

## npm Packages

None needed — uses existing Shiki for response highlighting.

## Logic Notes

### Proxy Architecture

The frontend NEVER makes direct HTTP calls to external APIs. Instead:

1. Frontend builds a `ProxyRequest` (method, URL, headers, body)
2. Frontend sends it to `POST /api/api-playground/send`
3. Backend resolves `{{VAR}}` templates using linked Env Vault
4. Backend executes the real HTTP request with a 30s timeout
5. Backend captures response (status, headers, body, size, timing)
6. Backend auto-saves to `api_request_history`
7. Backend returns `ProxyResponse` to frontend

This avoids all CORS issues since the request originates from the Go server.

### Variable Substitution

```go
// Resolve {{VAR_NAME}} in a string using env vault variables
func resolveTemplates(input string, variables map[string]string) string {
    re := regexp.MustCompile(`\{\{(\w+)\}\}`)
    return re.ReplaceAllStringFunc(input, func(match string) string {
        key := match[2 : len(match)-2]
        if val, ok := variables[key]; ok {
            return val
        }
        return match // leave unresolved
    })
}
```

Applied to: URL, header values, query param values, body.

### cURL Export

```go
func generateCurl(req ProxyRequest) string {
    parts := []string{"curl"}
    if req.Method != "GET" {
        parts = append(parts, "-X", req.Method)
    }
    for k, v := range req.Headers {
        parts = append(parts, "-H", fmt.Sprintf("'%s: %s'", k, v))
    }
    if req.Body != "" {
        parts = append(parts, "-d", fmt.Sprintf("'%s'", req.Body))
    }
    parts = append(parts, fmt.Sprintf("'%s'", req.URL))
    return strings.Join(parts, " \\\n  ")
}
```

### Response Size Limit

Backend should limit response body capture to 5MB. If response exceeds this, truncate body and add a `[truncated]` indicator. The `response_size` field still reflects the actual size.

### Request Timeout

Backend proxy uses a separate `http.Client` with 30s timeout (not the main server's client). Frontend send request uses 35s timeout to account for overhead.
