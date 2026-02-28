# Module 11 — Regex Playground

> Difficulty: ⭐⭐ | One new table | No new packages

## Overview

Interactive regex tester — type a pattern and test string, see matches highlighted in real-time. Save frequently used patterns to a personal library. Includes a regex cheat sheet for quick reference. All matching runs client-side using the browser's `RegExp` engine; only saved patterns are persisted to the database.

## PostgreSQL Migration

```sql
-- backend/database/migrations/015_create_regex_patterns.up.sql

CREATE TABLE IF NOT EXISTS regex_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    pattern TEXT NOT NULL,
    flags TEXT NOT NULL DEFAULT 'g',        -- e.g. "gi", "gm", "gims"
    test_string TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regex_patterns_user_id ON regex_patterns(user_id);
```

## Go Backend

### Model

```go
// backend/models/regex_pattern.go

type RegexPattern struct {
    ID          uuid.UUID `json:"id"`
    UserID      uuid.UUID `json:"user_id"`
    Title       string    `json:"title"`
    Pattern     string    `json:"pattern"`
    Flags       string    `json:"flags"`
    TestString  string    `json:"test_string"`
    Description string    `json:"description"`
    Tags        []string  `json:"tags"`
    IsFavorite  bool      `json:"is_favorite"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type RegexPatternInput struct {
    Title       string   `json:"title"`
    Pattern     string   `json:"pattern"`
    Flags       string   `json:"flags"`
    TestString  string   `json:"test_string"`
    Description string   `json:"description"`
    Tags        []string `json:"tags"`
    IsFavorite  bool     `json:"is_favorite"`
}
```

### Repository

```go
// backend/repository/regex_pattern_repo.go

type RegexPatternRepo struct { pool *pgxpool.Pool }

func (r *RegexPatternRepo) ListByUser(ctx, userID) ([]RegexPattern, error)
// ORDER BY updated_at DESC

func (r *RegexPatternRepo) Create(ctx, userID, input) (*RegexPattern, error)

func (r *RegexPatternRepo) Update(ctx, userID, patternID, input) (*RegexPattern, error)

func (r *RegexPatternRepo) Delete(ctx, userID, patternID) error
```

### Handler

```go
// backend/handlers/regex_pattern.go

type RegexPatternHandler struct { repo *RegexPatternRepo }

func (h *RegexPatternHandler) List(w, r)   // GET    /api/regex-patterns
func (h *RegexPatternHandler) Create(w, r) // POST   /api/regex-patterns
func (h *RegexPatternHandler) Update(w, r) // PUT    /api/regex-patterns/{id}
func (h *RegexPatternHandler) Delete(w, r) // DELETE /api/regex-patterns/{id}
```

### Routes

```go
// Add to backend/router/router.go

mux.Handle("GET /api/regex-patterns", authMW(http.HandlerFunc(regexPattern.List)))
mux.Handle("POST /api/regex-patterns", authMW(http.HandlerFunc(regexPattern.Create)))
mux.Handle("PUT /api/regex-patterns/{id}", authMW(http.HandlerFunc(regexPattern.Update)))
mux.Handle("DELETE /api/regex-patterns/{id}", authMW(http.HandlerFunc(regexPattern.Delete)))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface RegexPattern {
  id: string;
  user_id: string;
  title: string;
  pattern: string;
  flags: string;
  test_string: string;
  description: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type RegexPatternInput = Pick<
  RegexPattern,
  "title" | "pattern" | "flags" | "test_string" | "description" | "tags" | "is_favorite"
>;
```

## Service Functions

```ts
// lib/services/regex-patterns.ts

import { api } from "@/lib/api/client";
import type { RegexPattern, RegexPatternInput } from "@/lib/types/database";

export async function getRegexPatterns(): Promise<RegexPattern[]> {
  return api.get<RegexPattern[]>("/api/regex-patterns");
}

export async function createRegexPattern(input: RegexPatternInput): Promise<RegexPattern> {
  return api.post<RegexPattern>("/api/regex-patterns", input);
}

export async function updateRegexPattern(id: string, input: RegexPatternInput): Promise<RegexPattern> {
  return api.put<RegexPattern>(`/api/regex-patterns/${id}`, input);
}

export async function deleteRegexPattern(id: string): Promise<void> {
  await api.delete(`/api/regex-patterns/${id}`);
}
```

## Hook

```ts
// hooks/use-regex-patterns.ts

export function useRegexPatterns() {
  return {
    patterns: RegexPattern[];
    loading: boolean;
    error: string | null;

    createPattern: (input: RegexPatternInput) => Promise<RegexPattern | undefined>;
    updatePattern: (id: string, input: RegexPatternInput) => Promise<RegexPattern | undefined>;
    deletePattern: (id: string) => Promise<void>;
    toggleFavorite: (pattern: RegexPattern) => Promise<void>;  // optimistic update

    refetch: () => Promise<void>;
  };
}
```

## Components

### RegexTester

```
components/regex-tester.tsx
```

Main interactive playground:
- **Pattern input**: monospace text input with `/pattern/` visual wrapping
- **Flags toggles**: clickable flag buttons (g, i, m, s, u) — active flags highlighted
- **Test string textarea**: multiline input, matches highlighted inline with colored `<mark>` spans
- **Match info panel**:
  - Match count: "3 matches found"
  - Match list: each match with index, value, and capture groups
  - Group names (if named groups used)
- **Error display**: if regex is invalid, show error message in red below pattern input
- **Action buttons**: [Save Pattern] [Clear] [Copy Regex]

### RegexCheatSheet

```
components/regex-cheat-sheet.tsx
```

Collapsible reference panel with common regex syntax:
- Character classes: `\d`, `\w`, `\s`, `.`, `[abc]`, `[^abc]`
- Quantifiers: `*`, `+`, `?`, `{n}`, `{n,m}`
- Anchors: `^`, `$`, `\b`
- Groups: `(...)`, `(?:...)`, `(?<name>...)`, `(?=...)`, `(?!...)`
- Flags: `g`, `i`, `m`, `s`, `u`
- Common patterns: email, URL, IP address, date

### PatternCard

```
components/regex-pattern-card.tsx
```

- Displays: title, pattern (monospace), flags, description (truncated), tags
- Click to load pattern into the tester
- Actions: favorite toggle, edit, delete (with confirmation)

### PatternForm

```
components/regex-pattern-form.tsx
```

Dialog form with fields:
- Title (text input, required)
- Pattern (monospace text input, required)
- Flags (checkbox group: g, i, m, s, u)
- Test String (textarea, optional)
- Description (textarea, optional)
- Tags (comma-separated input)

### Skeleton

```ts
// Add to components/skeletons.tsx

export function RegexPatternCardSkeleton() {
  // Card with: title, pattern code block, flags, description, tags
}
```

## Page Layout

```
app/(app)/regex/page.tsx
```

```
┌────────────────────────────────────────────────────────────┐
│ Regex Playground                            [Cheat Sheet ▼]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Pattern:  /                                           /   │
│            [  ^(\d{3})-(\d{3})-(\d{4})$              ]     │
│                                                            │
│  Flags:    [g] [i] [ m ] [ s ] [ u ]                      │
│                                                            │
│  Test String:                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Call me at [123-456-7890] or [098-765-4321]      │      │
│  │ My old number was [555-123-4567]                 │      │
│  │                                  (highlighted)   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                            │
│  3 matches found              [Save Pattern] [Copy] [Clear]│
│  ┌──────────────────────────────────────────────────┐      │
│  │ Match 1: "123-456-7890"  (index 11)              │      │
│  │   Group 1: "123"                                 │      │
│  │   Group 2: "456"                                 │      │
│  │   Group 3: "7890"                                │      │
│  │ Match 2: "098-765-4321"  (index 27)              │      │
│  │   ...                                            │      │
│  └──────────────────────────────────────────────────┘      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Saved Patterns                          [Search...]        │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│ │ Email Valid.  │ │ URL Parser   │ │ Date Format  │       │
│ │ /^[\w-]+@.+/ │ │ /https?:\/\/ │ │ /\d{4}-\d{2} │       │
│ │ [gi]     ★   │ │ [g]          │ │ [g]          │       │
│ └──────────────┘ └──────────────┘ └──────────────┘       │
└────────────────────────────────────────────────────────────┘
```

- Tester section at top (always visible)
- Saved patterns section below
- Cheat sheet as collapsible side panel or sheet

## Navigation

```ts
// In config/navigation.ts
import { Regex } from "lucide-react";

{
  title: "Regex",
  href: "/regex",
  icon: Regex,
}
```

## Config Files

```ts
// config/regex-cheatsheet.ts

export const regexCheatSheet = [
  {
    category: "Character Classes",
    items: [
      { pattern: ".", description: "Any character except newline" },
      { pattern: "\\d", description: "Digit [0-9]" },
      { pattern: "\\D", description: "Not a digit" },
      { pattern: "\\w", description: "Word character [a-zA-Z0-9_]" },
      { pattern: "\\W", description: "Not a word character" },
      { pattern: "\\s", description: "Whitespace" },
      { pattern: "\\S", description: "Not whitespace" },
      { pattern: "[abc]", description: "Any of a, b, or c" },
      { pattern: "[^abc]", description: "Not a, b, or c" },
      { pattern: "[a-z]", description: "Character range" },
    ],
  },
  {
    category: "Quantifiers",
    items: [
      { pattern: "*", description: "0 or more" },
      { pattern: "+", description: "1 or more" },
      { pattern: "?", description: "0 or 1" },
      { pattern: "{n}", description: "Exactly n" },
      { pattern: "{n,}", description: "n or more" },
      { pattern: "{n,m}", description: "Between n and m" },
    ],
  },
  {
    category: "Anchors",
    items: [
      { pattern: "^", description: "Start of string/line" },
      { pattern: "$", description: "End of string/line" },
      { pattern: "\\b", description: "Word boundary" },
      { pattern: "\\B", description: "Not a word boundary" },
    ],
  },
  {
    category: "Groups & Lookaround",
    items: [
      { pattern: "(abc)", description: "Capture group" },
      { pattern: "(?:abc)", description: "Non-capturing group" },
      { pattern: "(?<name>abc)", description: "Named capture group" },
      { pattern: "(?=abc)", description: "Positive lookahead" },
      { pattern: "(?!abc)", description: "Negative lookahead" },
      { pattern: "(?<=abc)", description: "Positive lookbehind" },
      { pattern: "(?<!abc)", description: "Negative lookbehind" },
      { pattern: "a|b", description: "Alternation (a or b)" },
    ],
  },
  {
    category: "Flags",
    items: [
      { pattern: "g", description: "Global — find all matches" },
      { pattern: "i", description: "Case-insensitive" },
      { pattern: "m", description: "Multiline — ^ and $ match line boundaries" },
      { pattern: "s", description: "Dotall — . matches newline" },
      { pattern: "u", description: "Unicode — full unicode support" },
    ],
  },
] as const;

export const commonPatterns = [
  { title: "Email", pattern: "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$", flags: "i" },
  { title: "URL", pattern: "https?:\\/\\/[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=]+", flags: "g" },
  { title: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
  { title: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g" },
  { title: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "gi" },
  { title: "Phone (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", flags: "g" },
] as const;
```

## npm Packages

None needed — uses native browser `RegExp`.

## Logic Notes

### Real-time Match Highlighting

```tsx
function highlightMatches(text: string, regex: RegExp): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex for global matching
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Highlighted match
    parts.push(
      <mark key={match.index} className="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">
        {match[0]}
      </mark>
    );
    lastIndex = match.index + match[0].length;

    // Prevent infinite loop for zero-length matches
    if (match[0].length === 0) {
      regex.lastIndex++;
    }
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
```

### Safe RegExp Construction

```ts
function tryCreateRegex(pattern: string, flags: string): RegExp | { error: string } {
  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid regex" };
  }
}
```

### Match Info Extraction

```ts
interface MatchInfo {
  fullMatch: string;
  index: number;
  groups: { name: string | number; value: string }[];
}

function extractMatches(text: string, regex: RegExp): MatchInfo[] {
  const matches: MatchInfo[] = [];
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const groups: { name: string | number; value: string }[] = [];
    for (let i = 1; i < match.length; i++) {
      groups.push({ name: i, value: match[i] ?? "" });
    }
    // Named groups
    if (match.groups) {
      for (const [name, value] of Object.entries(match.groups)) {
        const existing = groups.find((g) => g.value === value);
        if (existing) existing.name = name;
      }
    }
    matches.push({ fullMatch: match[0], index: match.index, groups });

    if (match[0].length === 0) regex.lastIndex++;
    if (matches.length > 1000) break;  // safety limit
  }
  return matches;
}
```

### Debounced Matching

- Pattern and test string changes are debounced (150ms) before re-running matches
- This prevents freezing on complex patterns or large test strings
- Use `useMemo` or `useEffect` with cleanup for the debounce
