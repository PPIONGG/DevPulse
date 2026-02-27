# Module 03 — URL Shortener

> Difficulty: ⭐⭐ | New table | No new packages

## Overview

Create short aliases for long URLs. Each link gets a short code that redirects to the target URL. Tracks click count. Links are personal (not publicly accessible redirects — just a personal link manager with copy-to-clipboard).

## Supabase SQL

```sql
CREATE TABLE links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  original_url TEXT NOT NULL,
  short_code TEXT NOT NULL,
  click_count INTEGER DEFAULT 0 NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own links"
  ON links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links"
  ON links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links"
  ON links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links"
  ON links FOR DELETE
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_links_short_code ON links(user_id, short_code);
CREATE INDEX idx_links_user_id ON links(user_id);
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface Link {
  id: string;
  user_id: string;
  title: string;
  original_url: string;
  short_code: string;
  click_count: number;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type LinkInput = Pick<
  Link,
  "title" | "original_url" | "short_code" | "tags" | "is_favorite"
>;
```

## Service Functions

```ts
// lib/services/links.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Link, LinkInput } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getLinks(
  supabase: SupabaseClient,
  userId: string
): Promise<Link[]>;
// Order by updated_at DESC

export async function createLink(
  supabase: SupabaseClient,
  userId: string,
  input: LinkInput
): Promise<Link>;

export async function updateLink(
  supabase: SupabaseClient,
  linkId: string,
  input: Partial<LinkInput>
): Promise<Link>;

export async function deleteLink(
  supabase: SupabaseClient,
  linkId: string
): Promise<void>;

export async function incrementClickCount(
  supabase: SupabaseClient,
  linkId: string
): Promise<void>;
// Use .rpc() or manual increment: fetch current, +1, update
```

## Hook

```ts
// hooks/use-links.ts

export function useLinks() {
  return {
    links: Link[];
    loading: boolean;
    error: string | null;
    createLink: (input: LinkInput) => Promise<Link | undefined>;
    updateLink: (id: string, input: Partial<LinkInput>) => Promise<Link | undefined>;
    deleteLink: (id: string) => Promise<void>;
    toggleFavorite: (link: Link) => Promise<void>;  // optimistic update
    trackClick: (link: Link) => Promise<void>;       // increment + open URL
    refetch: () => Promise<void>;
  };
}
```

## Components

### LinkCard

```
components/link-card.tsx
```

- Displays: title, truncated original URL, short code badge, click count, tags
- Actions: copy short code to clipboard, open original URL (+ track click), favorite toggle, edit, delete
- Copy button shows "Copied!" toast on click

### LinkForm

```
components/link-form.tsx
```

Dialog form with fields:
- Title (text input, required)
- Original URL (url input, required, validated)
- Short Code (text input, auto-generated but editable, alphanumeric + hyphens)
- Tags (tag input, same pattern as snippets/bookmarks)
- Is Favorite (checkbox)

### Skeleton

```ts
// Add to components/skeletons.tsx

export function LinkCardSkeleton() {
  // Card with: title, URL, short code badge, click count, tags
}
```

## Page Layout

```
app/(app)/links/page.tsx
```

```
┌──────────────────────────────────────────┐
│ Links                        [+ Add New] │
├──────────────────────────────────────────┤
│ [Search...]  [★ Favorites]              │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ My Portfolio                       │   │
│ │ https://very-long-url.com/path...  │   │
│ │ [abc123] 🔗 42 clicks  [📋 Copy]  │   │
│ │ #personal #portfolio               │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ GitHub Repo                        │   │
│ │ https://github.com/user/repo       │   │
│ │ [gh-repo] 🔗 15 clicks  [📋 Copy] │   │
│ │ #dev #github                       │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

- Single-column list layout (links are wide, not great as grid)
- Search by title or URL
- Toggle to show favorites only

## Navigation

```ts
// In config/navigation.ts
import { Link2 } from "lucide-react";

{
  title: "Links",
  href: "/links",
  icon: Link2,
}
```

## Config Files

None needed.

## npm Packages

None needed.

## Logic Notes

### Short Code Generation

```ts
function generateShortCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
```

- Auto-generate on form open, but allow user to customize
- Validate: 3-20 chars, alphanumeric + hyphens only
- Unique per user (enforced by DB unique index)

### Click Tracking

When user clicks "Open" on a link:
1. Optimistically increment local click count
2. Call `incrementClickCount` service
3. Open URL in new tab via `window.open(url, "_blank")`

### Copy to Clipboard

```ts
await navigator.clipboard.writeText(shortCode);
toast.success("Copied to clipboard");
```

### URL Validation

Validate on form submit that `original_url` is a valid URL (starts with `http://` or `https://`). Show inline error if invalid.
