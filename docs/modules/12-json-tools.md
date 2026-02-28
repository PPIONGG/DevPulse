# Module 12 — JSON Tools

> Difficulty: ⭐⭐ | One new table | 1 new package (`js-yaml`)

## Overview

A multi-tool for working with JSON and YAML — format, minify, validate, convert between formats, and compare two documents side-by-side with a visual diff. Saved transforms are persisted to the database for quick access to frequently used JSON structures. Most logic runs client-side; the database stores saved documents only.

## Features

1. **Format/Minify** — prettify JSON with configurable indentation (2/4 spaces, tabs) or minify to single line
2. **Validate** — parse and show clear error messages with line/column numbers
3. **JSON ↔ YAML** — convert between JSON and YAML in both directions
4. **Diff** — side-by-side comparison of two JSON documents with added/removed/changed highlighting
5. **Tree View** — collapsible tree visualization of JSON structure
6. **Saved Documents** — save frequently used JSON/YAML for quick reference

## PostgreSQL Migration

```sql
-- backend/database/migrations/016_create_json_documents.up.sql

CREATE TABLE IF NOT EXISTS json_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    format TEXT NOT NULL DEFAULT 'json',    -- 'json' or 'yaml'
    description TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_json_documents_user_id ON json_documents(user_id);
```

## Go Backend

### Model

```go
// backend/models/json_document.go

type JsonDocument struct {
    ID          uuid.UUID `json:"id"`
    UserID      uuid.UUID `json:"user_id"`
    Title       string    `json:"title"`
    Content     string    `json:"content"`
    Format      string    `json:"format"`      // "json" or "yaml"
    Description string    `json:"description"`
    Tags        []string  `json:"tags"`
    IsFavorite  bool      `json:"is_favorite"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type JsonDocumentInput struct {
    Title       string   `json:"title"`
    Content     string   `json:"content"`
    Format      string   `json:"format"`
    Description string   `json:"description"`
    Tags        []string `json:"tags"`
    IsFavorite  bool     `json:"is_favorite"`
}
```

### Repository

```go
// backend/repository/json_document_repo.go

type JsonDocumentRepo struct { pool *pgxpool.Pool }

func (r *JsonDocumentRepo) ListByUser(ctx, userID) ([]JsonDocument, error)
// ORDER BY updated_at DESC

func (r *JsonDocumentRepo) Create(ctx, userID, input) (*JsonDocument, error)

func (r *JsonDocumentRepo) Update(ctx, userID, docID, input) (*JsonDocument, error)

func (r *JsonDocumentRepo) Delete(ctx, userID, docID) error
```

### Handler

```go
// backend/handlers/json_document.go

type JsonDocumentHandler struct { repo *JsonDocumentRepo }

func (h *JsonDocumentHandler) List(w, r)   // GET    /api/json-documents
func (h *JsonDocumentHandler) Create(w, r) // POST   /api/json-documents
func (h *JsonDocumentHandler) Update(w, r) // PUT    /api/json-documents/{id}
func (h *JsonDocumentHandler) Delete(w, r) // DELETE /api/json-documents/{id}
```

### Routes

```go
// Add to backend/router/router.go

mux.Handle("GET /api/json-documents", authMW(http.HandlerFunc(jsonDoc.List)))
mux.Handle("POST /api/json-documents", authMW(http.HandlerFunc(jsonDoc.Create)))
mux.Handle("PUT /api/json-documents/{id}", authMW(http.HandlerFunc(jsonDoc.Update)))
mux.Handle("DELETE /api/json-documents/{id}", authMW(http.HandlerFunc(jsonDoc.Delete)))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface JsonDocument {
  id: string;
  user_id: string;
  title: string;
  content: string;
  format: "json" | "yaml";
  description: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type JsonDocumentInput = Pick<
  JsonDocument,
  "title" | "content" | "format" | "description" | "tags" | "is_favorite"
>;
```

## Service Functions

```ts
// lib/services/json-documents.ts

import { api } from "@/lib/api/client";
import type { JsonDocument, JsonDocumentInput } from "@/lib/types/database";

export async function getJsonDocuments(): Promise<JsonDocument[]> {
  return api.get<JsonDocument[]>("/api/json-documents");
}

export async function createJsonDocument(input: JsonDocumentInput): Promise<JsonDocument> {
  return api.post<JsonDocument>("/api/json-documents", input);
}

export async function updateJsonDocument(id: string, input: JsonDocumentInput): Promise<JsonDocument> {
  return api.put<JsonDocument>(`/api/json-documents/${id}`, input);
}

export async function deleteJsonDocument(id: string): Promise<void> {
  await api.delete(`/api/json-documents/${id}`);
}
```

## Hook

```ts
// hooks/use-json-documents.ts

export function useJsonDocuments() {
  return {
    documents: JsonDocument[];
    loading: boolean;
    error: string | null;

    createDocument: (input: JsonDocumentInput) => Promise<JsonDocument | undefined>;
    updateDocument: (id: string, input: JsonDocumentInput) => Promise<JsonDocument | undefined>;
    deleteDocument: (id: string) => Promise<void>;
    toggleFavorite: (doc: JsonDocument) => Promise<void>;  // optimistic update

    refetch: () => Promise<void>;
  };
}
```

## Components

### JsonEditor

```
components/json-editor.tsx
```

Main editor workspace with tabs for different tools:

**Tabs: [Format] [Convert] [Diff] [Tree]**

Each tab shares a common textarea input but has different outputs and actions.

### JsonFormatter (Format tab)

```
components/json-formatter.tsx
```

- Input textarea (left): paste or type JSON/YAML
- Output textarea (right): formatted result (read-only, with copy button)
- Toolbar: [Format] [Minify] [Validate Only]
- Indent selector: 2 spaces / 4 spaces / tabs
- Validation status: green checkmark or red error with line number
- Auto-detect input format (JSON vs YAML)

### JsonConverter (Convert tab)

```
components/json-converter.tsx
```

- Input textarea (left): source format
- Output textarea (right): converted result
- Direction toggle: JSON → YAML / YAML → JSON
- Copy button on output
- Error display if conversion fails

### JsonDiff (Diff tab)

```
components/json-diff.tsx
```

- Two input textareas side by side: "Original" and "Modified"
- Diff output below showing changes:
  - Added lines: green background
  - Removed lines: red background
  - Changed values: yellow highlight
  - Unchanged: normal
- Stats: "3 additions, 2 removals, 1 change"
- Option to compare structurally (sorted keys) vs literally

### JsonTreeView (Tree tab)

```
components/json-tree-view.tsx
```

- Input textarea at top
- Collapsible tree visualization below
- Each node shows: key, value type (string/number/boolean/null/array/object), value
- Arrays show item count: `items (3)`
- Objects show key count: `config {5}`
- Click to expand/collapse
- Color-coded by type: strings=green, numbers=blue, booleans=purple, null=gray

### DocumentCard

```
components/json-document-card.tsx
```

- Displays: title, format badge (JSON/YAML), description (truncated), tags
- Content preview: first 3 lines of content in monospace
- Click to load into editor
- Actions: favorite toggle, edit, delete (with confirmation)

### DocumentForm

```
components/json-document-form.tsx
```

Dialog form with fields:
- Title (text input, required)
- Content (monospace textarea, required)
- Format (select: JSON / YAML)
- Description (textarea, optional)
- Tags (comma-separated input)

### Skeleton

```ts
// Add to components/skeletons.tsx

export function JsonDocumentCardSkeleton() {
  // Card with: title, format badge, description, content preview lines, tags
}
```

## Page Layout

```
app/(app)/json-tools/page.tsx
```

```
┌──────────────────────────────────────────────────────────────┐
│ JSON Tools                                    [Save Current] │
├──────────────────────────────────────────────────────────────┤
│ [Format] [Convert] [Diff] [Tree]                             │
├──────────────────────────────────────────────────────────────┤
│                    Format Tab                                │
│ ┌─────────────────────────┐ ┌─────────────────────────┐     │
│ │ Input                   │ │ Output             [📋] │     │
│ │                         │ │                         │     │
│ │ {"name":"John",         │ │ {                       │     │
│ │ "age":30,"city":        │ │   "name": "John",      │     │
│ │ "New York"}             │ │   "age": 30,            │     │
│ │                         │ │   "city": "New York"    │     │
│ │                         │ │ }                       │     │
│ └─────────────────────────┘ └─────────────────────────┘     │
│                                                              │
│ Indent: [2] [4] [Tab]    ✅ Valid JSON                      │
│ [Format] [Minify] [Validate]                                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                    Diff Tab                                   │
│ ┌─────────────────────────┐ ┌─────────────────────────┐     │
│ │ Original                │ │ Modified                │     │
│ │ {                       │ │ {                       │     │
│ │   "name": "John",      │ │   "name": "Jane",      │ ← yellow │
│ │ - "age": 30,            │ │ + "age": 25,            │     │
│ │   "city": "NY"          │ │   "city": "NY",         │     │
│ │                         │ │ + "email": "j@x.com"    │ ← green  │
│ │ }                       │ │ }                       │     │
│ └─────────────────────────┘ └─────────────────────────┘     │
│ 1 changed, 1 added, 0 removed                               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Saved Documents                    [Search...]  [★ Fav]     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ API Response  │ │ Config File  │ │ Sample Data  │         │
│ │ [JSON]        │ │ [YAML]       │ │ [JSON]   ★   │         │
│ │ {"users":...  │ │ server:...   │ │ [{"id":1...  │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

- Tool tabs at top (Format / Convert / Diff / Tree)
- Split-pane editor for each tool
- Saved documents section at bottom

## Navigation

```ts
// In config/navigation.ts
import { Braces } from "lucide-react";

{
  title: "JSON Tools",
  href: "/json-tools",
  icon: Braces,
}
```

## Config Files

None needed.

## npm Packages

```bash
npm install js-yaml
npm install -D @types/js-yaml
```

## Logic Notes

### JSON Format / Minify

```ts
function formatJson(input: string, indent: number | string = 2): string {
  const parsed = JSON.parse(input);  // throws on invalid JSON
  return JSON.stringify(parsed, null, indent);
}

function minifyJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}
```

### JSON Validation with Error Location

```ts
interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

function validateJson(input: string): ValidationResult {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    // Extract line/column from error message (format varies by engine)
    const posMatch = message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const lines = input.slice(0, pos).split("\n");
      return {
        valid: false,
        error: message,
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
      };
    }
    return { valid: false, error: message };
  }
}
```

### JSON ↔ YAML Conversion

```ts
import yaml from "js-yaml";

function jsonToYaml(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  return yaml.dump(parsed, {
    indent: 2,
    lineWidth: -1,  // no line wrapping
    noRefs: true,
  });
}

function yamlToJson(yamlStr: string, indent: number = 2): string {
  const parsed = yaml.load(yamlStr);
  return JSON.stringify(parsed, null, indent);
}
```

### JSON Diff Algorithm

```ts
interface DiffEntry {
  path: string;           // e.g. "users[0].name"
  type: "added" | "removed" | "changed";
  oldValue?: unknown;
  newValue?: unknown;
}

function diffJson(original: string, modified: string): DiffEntry[] {
  const a = JSON.parse(original);
  const b = JSON.parse(modified);
  return deepDiff(a, b, "");
}

function deepDiff(a: unknown, b: unknown, path: string): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  if (a === b) return diffs;

  if (typeof a !== typeof b || a === null || b === null) {
    diffs.push({ path, type: "changed", oldValue: a, newValue: b });
    return diffs;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= a.length) {
        diffs.push({ path: childPath, type: "added", newValue: b[i] });
      } else if (i >= b.length) {
        diffs.push({ path: childPath, type: "removed", oldValue: a[i] });
      } else {
        diffs.push(...deepDiff(a[i], b[i], childPath));
      }
    }
    return diffs;
  }

  if (typeof a === "object" && typeof b === "object") {
    const allKeys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key;
      if (!(key in (a as object))) {
        diffs.push({ path: childPath, type: "added", newValue: (b as Record<string, unknown>)[key] });
      } else if (!(key in (b as object))) {
        diffs.push({ path: childPath, type: "removed", oldValue: (a as Record<string, unknown>)[key] });
      } else {
        diffs.push(...deepDiff(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
          childPath
        ));
      }
    }
    return diffs;
  }

  diffs.push({ path, type: "changed", oldValue: a, newValue: b });
  return diffs;
}
```

### Tree View Data Structure

```ts
interface TreeNode {
  key: string;
  value: unknown;
  type: "string" | "number" | "boolean" | "null" | "array" | "object";
  children?: TreeNode[];
  childCount?: number;  // for arrays/objects
  expanded: boolean;
}

function buildTree(data: unknown, key: string = "root"): TreeNode {
  if (data === null) return { key, value: null, type: "null", expanded: false };
  if (Array.isArray(data)) {
    return {
      key,
      value: data,
      type: "array",
      childCount: data.length,
      children: data.map((item, i) => buildTree(item, `${i}`)),
      expanded: true,
    };
  }
  if (typeof data === "object") {
    return {
      key,
      value: data,
      type: "object",
      childCount: Object.keys(data).length,
      children: Object.entries(data).map(([k, v]) => buildTree(v, k)),
      expanded: true,
    };
  }
  return { key, value: data, type: typeof data as TreeNode["type"], expanded: false };
}
```

### Auto-detect Format

```ts
function detectFormat(input: string): "json" | "yaml" | "unknown" {
  const trimmed = input.trim();
  // JSON starts with { or [
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  // Try JSON parse
  try { JSON.parse(trimmed); return "json"; } catch {}
  // Try YAML parse (if it doesn't look like JSON, assume YAML)
  try { yaml.load(trimmed); return "yaml"; } catch {}
  return "unknown";
}
```

### Syntax Highlighting in Output

- Use Shiki (already in project) with `json` or `yaml` language for the output textarea
- Or use a simple monospace textarea with colored validation indicator
- Tree view uses Tailwind color classes per type
