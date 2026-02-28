# DevPulse — New Modules Implementation Guide

## Overview

Twelve feature modules for DevPulse. Each module has its own detailed spec in this directory. Implement them in order — earlier modules are simpler and establish patterns reused by later ones.

## Module Status

| # | Module | File | Difficulty | Status | หมายเหตุ |
|---|--------|------|-----------|--------|----------|
| 1 | Calculator | [01-calculator.md](./01-calculator.md) | ⭐ | ✅ Done | — |
| 2 | Expense Tracker | [02-expenses.md](./02-expenses.md) | ⭐⭐ | ✅ Done | — |
| 3 | URL Shortener | [03-links.md](./03-links.md) | ⭐⭐ | ⏭️ Skipped | อาจกลับมาทำทีหลัง |
| 4 | Markdown Blog | [04-blog.md](./04-blog.md) | ⭐⭐ | ⏭️ Skipped | อาจกลับมาทำทีหลัง |
| 5 | Polls / Voting | [05-polls.md](./05-polls.md) | ⭐⭐⭐ | ⏭️ Skipped | อาจกลับมาทำทีหลัง |
| 6 | Habit Tracker | [06-habits.md](./06-habits.md) | ⭐⭐⭐ | ✅ Done | — |
| 7 | Flashcards (SM-2) | [07-flashcards.md](./07-flashcards.md) | ⭐⭐⭐ | ⏭️ Skipped | อาจกลับมาทำทีหลัง |
| 8 | Kanban Board | [08-kanban.md](./08-kanban.md) | ⭐⭐⭐ | ✅ Done | — |
| 9 | Pomodoro Timer | [09-pomodoro.md](./09-pomodoro.md) | ⭐⭐ | ✅ Done | — |
| 10 | Env Vault | [10-env-vault.md](./10-env-vault.md) | ⭐⭐ | ✅ Done | — |
| 11 | Regex Playground | [11-regex-playground.md](./11-regex-playground.md) | ⭐⭐ | 📝 Draft | อาจกลับมาทำทีหลัง |
| 12 | JSON Tools | [12-json-tools.md](./12-json-tools.md) | ⭐⭐ | ✅ Done | — |

## Shared Patterns

Every module follows the same architecture established by existing features (snippets, calculator, expenses, etc.):

### Files to create/modify per module

```
lib/types/database.ts          ← add interface + Input type
lib/services/<module>.ts       ← new service file (all fns use withTimeout)
hooks/use-<module>.ts          ← new hook (mountedRef + toast pattern)
components/<module>-card.tsx   ← new card component
components/<module>-form.tsx   ← new form component (dialog-based)
components/skeletons.tsx       ← add skeleton component
app/(app)/<module>/page.tsx    ← new page (client component)
config/navigation.ts           ← add nav item
config/<module-config>.ts      ← new config file (if categories/colors needed)
```

### Service pattern

```ts
import { api } from "@/lib/api/client";
import type { Item, ItemInput } from "@/lib/types/database";

export async function getItems(): Promise<Item[]> {
  return api.get<Item[]>("/api/items");
}

export async function createItem(input: ItemInput): Promise<Item> {
  return api.post<Item>("/api/items", input);
}

export async function updateItem(id: string, input: ItemInput): Promise<Item> {
  return api.put<Item>(`/api/items/${id}`, input);
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/api/items/${id}`);
}
```

### Hook pattern

```ts
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getItems, createItem, updateItem, deleteItem } from "@/lib/services/items";
import { useAuth } from "@/providers/auth-provider";
import type { Item, ItemInput } from "@/lib/types/database";

export function useItems() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // all setState calls guarded by mountedRef.current
  // mutations call toast.success() on success
  // toggleFavorite uses optimistic update with toast.error() on revert
}
```

### Page pattern

```tsx
"use client";
export default function ModulePage() {
  const { items, loading, error, ...mutations } = useModule();
  // error banner with "Try again" → refetch
  // skeleton cards while loading
  // empty state when no items
  // search/filter bar
  // grid of cards
  // dialog form for create/edit
}
```

### Navigation entry

Add to `config/navigation.ts` in the `navigationItems` array, before the Settings entry.

## npm Packages to Install

```bash
# Module 04 — Markdown Blog
npm install react-markdown remark-gfm

# Module 08 — Kanban Board
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Module 12 — JSON Tools
npm install js-yaml && npm install -D @types/js-yaml
```

## Verification

After implementing each module:

```bash
cd frontend
npm run build   # type-check + build
npm run lint    # lint check
```

## Navigation Config Changes

All new nav items go into `config/navigation.ts`, inserted before the Settings entry. Current sidebar order:

1. Dashboard
2. Code Snippets (My Snippets, Shared)
3. Expenses
4. Habits
5. Kanban
6. Pomodoro
7. Env Vault
8. JSON Tools
9. Calculator
10. Settings
