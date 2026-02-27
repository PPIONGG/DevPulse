# Module 04 — Markdown Blog

> Difficulty: ⭐⭐ | New table | New packages: react-markdown, remark-gfm

## Overview

Write and publish markdown blog posts with live preview. Posts can be public or draft. Supports GitHub-Flavored Markdown (tables, task lists, strikethrough). Similar to Articles in knowledge base but with public/draft status and markdown rendering.

## Supabase SQL

```sql
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT DEFAULT '' NOT NULL,
  excerpt TEXT DEFAULT '' NOT NULL,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published')),
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blog posts"
  ON blog_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blog posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blog posts"
  ON blog_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_blog_posts_slug ON blog_posts(user_id, slug);
CREATE INDEX idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: "draft" | "published";
  is_favorite: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BlogPostInput = Pick<
  BlogPost,
  "title" | "slug" | "content" | "excerpt" | "tags" | "status" | "is_favorite"
>;
```

## Service Functions

```ts
// lib/services/blog-posts.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogPost, BlogPostInput } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getBlogPosts(
  supabase: SupabaseClient,
  userId: string
): Promise<BlogPost[]>;
// Order by updated_at DESC

export async function createBlogPost(
  supabase: SupabaseClient,
  userId: string,
  input: BlogPostInput
): Promise<BlogPost>;
// If status === "published", set published_at to now()

export async function updateBlogPost(
  supabase: SupabaseClient,
  postId: string,
  input: Partial<BlogPostInput>
): Promise<BlogPost>;
// If changing status to "published" and published_at is null, set published_at

export async function deleteBlogPost(
  supabase: SupabaseClient,
  postId: string
): Promise<void>;
```

## Hook

```ts
// hooks/use-blog-posts.ts

export function useBlogPosts() {
  return {
    posts: BlogPost[];
    loading: boolean;
    error: string | null;
    createPost: (input: BlogPostInput) => Promise<BlogPost | undefined>;
    updatePost: (id: string, input: Partial<BlogPostInput>) => Promise<BlogPost | undefined>;
    deletePost: (id: string) => Promise<void>;
    toggleFavorite: (post: BlogPost) => Promise<void>;  // optimistic update
    refetch: () => Promise<void>;
  };
}
```

## Components

### BlogPostCard

```
components/blog-post-card.tsx
```

- Displays: title, excerpt (truncated to 2 lines), status badge (draft/published), published date, tags
- Draft badge: muted/outline style. Published badge: green/solid.
- Actions: favorite toggle, edit, delete
- Click card to open editor/preview

### BlogPostForm

```
components/blog-post-form.tsx
```

This is a **full-page form** (not a dialog) since blog posts need space for writing:

- Title (text input, required)
- Slug (text input, auto-generated from title, editable)
- Excerpt (textarea, short summary)
- Content (large textarea with markdown)
- Tags (tag input)
- Status (select: draft / published)
- **Live preview panel** — side by side with editor on desktop, tabbed on mobile

Alternatively, use a dialog with a two-column layout (editor left, preview right).

### MarkdownPreview

```
components/markdown-preview.tsx
```

- Uses `react-markdown` with `remark-gfm` plugin
- Renders markdown content with proper styling (prose classes)
- Handles code blocks with existing `CodeBlock` component for syntax highlighting

### Skeleton

```ts
// Add to components/skeletons.tsx

export function BlogPostCardSkeleton() {
  // Card with: title, excerpt lines, status badge, date, tags
}
```

## Page Layout

```
app/(app)/blog/page.tsx
```

### List View

```
┌──────────────────────────────────────────┐
│ Blog                         [+ New Post]│
├──────────────────────────────────────────┤
│ [Search...]  [All ▼]  [★ Favorites]     │
├──────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │  Post   │ │  Post   │ │  Post   │    │
│ │  Card   │ │  Card   │ │  Card   │    │
│ └─────────┘ └─────────┘ └─────────┘    │
└──────────────────────────────────────────┘
```

### Editor View (dialog or inline)

```
┌──────────────────────────────────────────┐
│ [← Back]  Edit Post            [Save]    │
├───────────────────┬──────────────────────┤
│   Markdown Editor │   Live Preview       │
│                   │                      │
│   # Hello World   │   Hello World        │
│                   │   ───────────        │
│   Some **bold**   │   Some bold text     │
│   text here       │   here               │
│                   │                      │
└───────────────────┴──────────────────────┘
```

- Filter bar: search by title, filter by status (all/draft/published), favorites toggle
- Grid of post cards (responsive: 1/2/3 columns)

## Navigation

```ts
// In config/navigation.ts
import { PenLine } from "lucide-react";

{
  title: "Blog",
  href: "/blog",
  icon: PenLine,
}
```

## Config Files

None needed.

## npm Packages

```bash
npm install react-markdown remark-gfm
```

## Logic Notes

### Slug Generation

```ts
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- Auto-generate when title changes (only if slug hasn't been manually edited)
- Validate: lowercase alphanumeric + hyphens, 3-100 chars
- Unique per user (enforced by DB unique index)

### Markdown Rendering

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {content}
</ReactMarkdown>
```

- Apply Tailwind prose classes for nice typography
- Override code block rendering to use existing `CodeBlock` component

### Published At Logic

- When creating with status "published": set `published_at` to `new Date().toISOString()`
- When updating from "draft" to "published": set `published_at` if null
- When updating from "published" to "draft": keep `published_at` (don't clear it)

### Excerpt Auto-generation

If excerpt is empty on save, auto-generate from first 150 characters of content (strip markdown syntax).
