# Module 10 — Environment Variable Vault

> Difficulty: ⭐⭐ | Two new tables | No new packages

## Overview

Securely store environment variables organized by project and environment (dev/staging/prod). Each vault is a collection of key-value pairs. Values are masked by default and can be revealed on click. Copy entire `.env` blocks with one click. Import from pasted `.env` text. A developer-focused tool that solves the real problem of juggling env vars across projects.

## PostgreSQL Migration

```sql
-- backend/database/migrations/014_create_env_vaults.up.sql

CREATE TABLE IF NOT EXISTS env_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- e.g. "My SaaS App"
    environment TEXT NOT NULL DEFAULT 'development',  -- development, staging, production, custom
    description TEXT NOT NULL DEFAULT '',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS env_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES env_vaults(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    is_secret BOOLEAN NOT NULL DEFAULT true,   -- mask value by default
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_vaults_user_id ON env_vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_env_variables_vault_id ON env_variables(vault_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_env_variables_unique_key ON env_variables(vault_id, key);
```

## Go Backend

### Model

```go
// backend/models/env_vault.go

type EnvVault struct {
    ID          uuid.UUID     `json:"id"`
    UserID      uuid.UUID     `json:"user_id"`
    Name        string        `json:"name"`
    Environment string        `json:"environment"`
    Description string        `json:"description"`
    IsFavorite  bool          `json:"is_favorite"`
    Variables   []EnvVariable `json:"variables"`
    CreatedAt   time.Time     `json:"created_at"`
    UpdatedAt   time.Time     `json:"updated_at"`
}

type EnvVaultInput struct {
    Name        string `json:"name"`
    Environment string `json:"environment"`
    Description string `json:"description"`
    IsFavorite  bool   `json:"is_favorite"`
}

type EnvVariable struct {
    ID        uuid.UUID `json:"id"`
    VaultID   uuid.UUID `json:"vault_id"`
    Key       string    `json:"key"`
    Value     string    `json:"value"`
    IsSecret  bool      `json:"is_secret"`
    Position  int       `json:"position"`
    CreatedAt time.Time `json:"created_at"`
}

type EnvVariableInput struct {
    Key      string `json:"key"`
    Value    string `json:"value"`
    IsSecret bool   `json:"is_secret"`
}

type EnvImportInput struct {
    Raw string `json:"raw"`   // raw .env file content to parse
}
```

### Repository

```go
// backend/repository/env_vault_repo.go

type EnvVaultRepo struct { pool *pgxpool.Pool }

func (r *EnvVaultRepo) ListByUser(ctx, userID) ([]EnvVault, error)
// Fetch vaults + all variables, join client-side
// ORDER BY updated_at DESC; variables ORDER BY position ASC

func (r *EnvVaultRepo) GetByID(ctx, userID, vaultID) (*EnvVault, error)

func (r *EnvVaultRepo) Create(ctx, userID, input) (*EnvVault, error)

func (r *EnvVaultRepo) Update(ctx, userID, vaultID, input) (*EnvVault, error)

func (r *EnvVaultRepo) Delete(ctx, userID, vaultID) error

func (r *EnvVaultRepo) AddVariable(ctx, userID, vaultID, input) (*EnvVariable, error)
// Validate vault ownership, then insert variable

func (r *EnvVaultRepo) UpdateVariable(ctx, userID, varID, input) (*EnvVariable, error)

func (r *EnvVaultRepo) DeleteVariable(ctx, userID, varID) error

func (r *EnvVaultRepo) ImportVariables(ctx, userID, vaultID, raw string) ([]EnvVariable, error)
// Parse raw .env content → upsert variables (ON CONFLICT update value)
```

### Handler

```go
// backend/handlers/env_vault.go

type EnvVaultHandler struct { repo *EnvVaultRepo }

func (h *EnvVaultHandler) List(w, r)            // GET    /api/env-vaults
func (h *EnvVaultHandler) Get(w, r)             // GET    /api/env-vaults/{id}
func (h *EnvVaultHandler) Create(w, r)          // POST   /api/env-vaults
func (h *EnvVaultHandler) Update(w, r)          // PUT    /api/env-vaults/{id}
func (h *EnvVaultHandler) Delete(w, r)          // DELETE /api/env-vaults/{id}
func (h *EnvVaultHandler) AddVariable(w, r)     // POST   /api/env-vaults/{id}/variables
func (h *EnvVaultHandler) UpdateVariable(w, r)  // PUT    /api/env-variables/{id}
func (h *EnvVaultHandler) DeleteVariable(w, r)  // DELETE /api/env-variables/{id}
func (h *EnvVaultHandler) Import(w, r)          // POST   /api/env-vaults/{id}/import
```

### Routes

```go
// Add to backend/router/router.go

mux.Handle("GET /api/env-vaults", authMW(http.HandlerFunc(envVault.List)))
mux.Handle("GET /api/env-vaults/{id}", authMW(http.HandlerFunc(envVault.Get)))
mux.Handle("POST /api/env-vaults", authMW(http.HandlerFunc(envVault.Create)))
mux.Handle("PUT /api/env-vaults/{id}", authMW(http.HandlerFunc(envVault.Update)))
mux.Handle("DELETE /api/env-vaults/{id}", authMW(http.HandlerFunc(envVault.Delete)))
mux.Handle("POST /api/env-vaults/{id}/variables", authMW(http.HandlerFunc(envVault.AddVariable)))
mux.Handle("PUT /api/env-variables/{id}", authMW(http.HandlerFunc(envVault.UpdateVariable)))
mux.Handle("DELETE /api/env-variables/{id}", authMW(http.HandlerFunc(envVault.DeleteVariable)))
mux.Handle("POST /api/env-vaults/{id}/import", authMW(http.HandlerFunc(envVault.Import)))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface EnvVariable {
  id: string;
  vault_id: string;
  key: string;
  value: string;
  is_secret: boolean;
  position: number;
  created_at: string;
}

export interface EnvVault {
  id: string;
  user_id: string;
  name: string;
  environment: string;
  description: string;
  is_favorite: boolean;
  variables: EnvVariable[];
  created_at: string;
  updated_at: string;
}

export type EnvVaultInput = Pick<
  EnvVault,
  "name" | "environment" | "description" | "is_favorite"
>;

export type EnvVariableInput = Pick<
  EnvVariable,
  "key" | "value" | "is_secret"
>;
```

## Service Functions

```ts
// lib/services/env-vaults.ts

import { api } from "@/lib/api/client";
import type { EnvVault, EnvVaultInput, EnvVariable, EnvVariableInput } from "@/lib/types/database";

export async function getEnvVaults(): Promise<EnvVault[]> {
  return api.get<EnvVault[]>("/api/env-vaults");
}

export async function getEnvVault(id: string): Promise<EnvVault> {
  return api.get<EnvVault>(`/api/env-vaults/${id}`);
}

export async function createEnvVault(input: EnvVaultInput): Promise<EnvVault> {
  return api.post<EnvVault>("/api/env-vaults", input);
}

export async function updateEnvVault(id: string, input: EnvVaultInput): Promise<EnvVault> {
  return api.put<EnvVault>(`/api/env-vaults/${id}`, input);
}

export async function deleteEnvVault(id: string): Promise<void> {
  await api.delete(`/api/env-vaults/${id}`);
}

export async function addEnvVariable(vaultId: string, input: EnvVariableInput): Promise<EnvVariable> {
  return api.post<EnvVariable>(`/api/env-vaults/${vaultId}/variables`, input);
}

export async function updateEnvVariable(id: string, input: EnvVariableInput): Promise<EnvVariable> {
  return api.put<EnvVariable>(`/api/env-variables/${id}`, input);
}

export async function deleteEnvVariable(id: string): Promise<void> {
  await api.delete(`/api/env-variables/${id}`);
}

export async function importEnvVariables(vaultId: string, raw: string): Promise<EnvVariable[]> {
  return api.post<EnvVariable[]>(`/api/env-vaults/${vaultId}/import`, { raw });
}
```

## Hook

```ts
// hooks/use-env-vaults.ts

export function useEnvVaults() {
  return {
    vaults: EnvVault[];
    loading: boolean;
    error: string | null;

    createVault: (input: EnvVaultInput) => Promise<EnvVault | undefined>;
    updateVault: (id: string, input: EnvVaultInput) => Promise<EnvVault | undefined>;
    deleteVault: (id: string) => Promise<void>;
    toggleFavorite: (vault: EnvVault) => Promise<void>;  // optimistic update

    addVariable: (vaultId: string, input: EnvVariableInput) => Promise<void>;
    updateVariable: (vaultId: string, varId: string, input: EnvVariableInput) => Promise<void>;
    deleteVariable: (vaultId: string, varId: string) => Promise<void>;
    importVariables: (vaultId: string, raw: string) => Promise<void>;

    refetch: () => Promise<void>;
  };
}
```

## Components

### VaultCard

```
components/vault-card.tsx
```

- Displays: vault name, environment badge (colored), description (truncated), variable count
- Environment badge colors: development=blue, staging=yellow, production=red, custom=gray
- Actions: favorite toggle, copy as .env, edit, delete (with confirmation)
- Click to expand/open detail view showing all variables

### VaultForm

```
components/vault-form.tsx
```

Dialog form with fields:
- Name (text input, required)
- Environment (select: development, staging, production, custom)
- Description (textarea, optional)

### VariableRow

```
components/variable-row.tsx
```

- Inline editable row: `KEY` = `•••••••` (masked) or `actual_value` (revealed)
- Toggle eye icon to reveal/mask individual values
- Inline edit (click key or value to edit)
- Delete button (X icon) per row
- `is_secret` toggle (lock icon)

### VaultDetail

```
components/vault-detail.tsx
```

- Expanded view of a vault (sheet/panel or inline expand)
- Header: vault name + environment badge
- Action bar: [+ Add Variable] [Import .env] [Copy All] [Export .env]
- List of `VariableRow` components
- "Reveal All" / "Hide All" toggle

### ImportDialog

```
components/vault-import-dialog.tsx
```

- Textarea to paste raw `.env` file content
- Preview parsed key-value pairs before importing
- Import button — upserts into the vault

### Skeleton

```ts
// Add to components/skeletons.tsx

export function VaultCardSkeleton() {
  // Card with: name, environment badge, description, variable count
}
```

## Page Layout

```
app/(app)/env-vault/page.tsx
```

```
┌────────────────────────────────────────────────────┐
│ Env Vault                           [+ New Vault]  │
├────────────────────────────────────────────────────┤
│ [Search...]  [All Envs ▼]  [★ Favorites]          │
├────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐     │
│ │ My SaaS App        │ │ Side Project       │     │
│ │ [Production] ★     │ │ [Development]      │     │
│ │ Main API keys...   │ │ Local dev setup    │     │
│ │ 12 variables       │ │ 5 variables        │     │
│ │ [Copy] [Edit] [Del]│ │ [Copy] [Edit] [Del]│     │
│ └────────────────────┘ └────────────────────┘     │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ ▼ My SaaS App  [Production]                    │ │
│ │   [+ Add] [Import] [Copy All] [Reveal All]    │ │
│ │ ──────────────────────────────────────────     │ │
│ │  DATABASE_URL    = ••••••••••••••••  👁 🗑    │ │
│ │  API_KEY         = ••••••••••••••••  👁 🗑    │ │
│ │  STRIPE_SECRET   = sk_live_•••••••  👁 🗑    │ │
│ │  REDIS_URL       = redis://•••••••  👁 🗑    │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

- Grid of vault cards (responsive: 1/2/3 columns)
- Click a card to expand detail view inline or as a side sheet
- Filter by environment, search by name, favorites toggle

## Navigation

```ts
// In config/navigation.ts
import { KeyRound } from "lucide-react";

{
  title: "Env Vault",
  href: "/env-vault",
  icon: KeyRound,
}
```

## Config Files

```ts
// config/environments.ts

export const environments = [
  { value: "development", label: "Development", color: "bg-blue-500" },
  { value: "staging", label: "Staging", color: "bg-yellow-500" },
  { value: "production", label: "Production", color: "bg-red-500" },
  { value: "custom", label: "Custom", color: "bg-gray-500" },
] as const;

export type Environment = (typeof environments)[number]["value"];
```

## npm Packages

None needed.

## Logic Notes

### .env Parsing (Backend)

```go
// Parse raw .env content into key-value pairs
func parseEnvFile(raw string) []EnvVariableInput {
    var vars []EnvVariableInput
    for _, line := range strings.Split(raw, "\n") {
        line = strings.TrimSpace(line)
        if line == "" || strings.HasPrefix(line, "#") {
            continue
        }
        parts := strings.SplitN(line, "=", 2)
        if len(parts) != 2 {
            continue
        }
        key := strings.TrimSpace(parts[0])
        value := strings.TrimSpace(parts[1])
        // Strip surrounding quotes
        value = strings.Trim(value, `"'`)
        vars = append(vars, EnvVariableInput{Key: key, Value: value, IsSecret: true})
    }
    return vars
}
```

### Copy as .env

```ts
// Frontend — generates .env text and copies to clipboard
function copyAsEnv(variables: EnvVariable[]) {
  const text = variables
    .map((v) => `${v.key}=${v.value}`)
    .join("\n");
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}
```

### Export as .env file

```ts
// Download as .env file
function exportAsEnv(name: string, variables: EnvVariable[]) {
  const text = variables.map((v) => `${v.key}=${v.value}`).join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.env`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Value Masking

- By default, `is_secret` variables show `••••••••` (8 dots)
- Non-secret variables show their value in plain text
- "Reveal" toggles per-variable or "Reveal All" at vault level
- Reveal state is client-side only (not persisted)

### Unique Key Enforcement

- Database has a unique constraint on `(vault_id, key)`
- Import uses upsert: if key already exists, update the value
- Frontend shows validation error if user tries to add a duplicate key manually
