# DevPulse — New Modules Implementation Guide

## Overview

Eight new feature modules to add to DevPulse. Each module has its own detailed spec in this directory. Implement them in order — earlier modules are simpler and establish patterns reused by later ones.

## Implementation Order

| # | Module | File | Difficulty | New Packages |
|---|--------|------|-----------|--------------|
| 1 | Calculator | [01-calculator.md](./01-calculator.md) | ⭐ | — |
| 2 | Expense Tracker | [02-expenses.md](./02-expenses.md) | ⭐⭐ | — |
| 3 | URL Shortener | [03-links.md](./03-links.md) | ⭐⭐ | — |
| 4 | Markdown Blog | [04-blog.md](./04-blog.md) | ⭐⭐ | react-markdown, remark-gfm |
| 5 | Polls / Voting | [05-polls.md](./05-polls.md) | ⭐⭐⭐ | — |
| 6 | Habit Tracker | [06-habits.md](./06-habits.md) | ⭐⭐⭐ | — |
| 7 | Flashcards (SM-2) | [07-flashcards.md](./07-flashcards.md) | ⭐⭐⭐ | — |
| 8 | Kanban Board | [08-kanban.md](./08-kanban.md) | ⭐⭐⭐ | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |

## Shared Patterns

Every module follows the same architecture established by existing features (snippets, work-logs, articles, bookmarks):

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
import type { SupabaseClient } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getItems(supabase: SupabaseClient, userId: string) {
  const { data, error } = await withTimeout(
    supabase.from("table").select("*").eq("user_id", userId).order("updated_at", { ascending: false })
  );
  if (error) throw error;
  return data ?? [];
}
```

### Hook pattern

```ts
"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

export function useModule() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState([]);
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
```

## Verification

After implementing each module:

```bash
cd frontend
npm run build   # type-check + build
npm run lint    # lint check
```

## Navigation Config Changes

All 8 new nav items go into `config/navigation.ts`, inserted before the Settings entry. The final sidebar order will be:

1. Dashboard
2. Knowledge Base (Articles, Bookmarks)
3. Code Snippets (My Snippets, Shared)
4. Work Log
5. **Calculator** ← new
6. **Expenses** ← new
7. **Links** ← new
8. **Blog** ← new
9. **Polls** ← new
10. **Habits** ← new
11. **Flashcards** ← new
12. **Kanban** ← new
13. Settings
