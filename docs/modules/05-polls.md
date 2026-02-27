# Module 05 — Polls / Voting

> Difficulty: ⭐⭐⭐ | Two new tables | No new packages

## Overview

Create polls with multiple options. Users can vote on their own polls (useful for decision-making). Each poll has options with vote counts displayed as percentage bars. Polls can be open or closed.

## Supabase SQL

```sql
-- Polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'closed')),
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Poll options table
CREATE TABLE poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0 NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- Polls RLS
CREATE POLICY "Users can view own polls"
  ON polls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own polls"
  ON polls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own polls"
  ON polls FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own polls"
  ON polls FOR DELETE
  USING (auth.uid() = user_id);

-- Poll options RLS (access through poll ownership)
CREATE POLICY "Users can view options of own polls"
  ON poll_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert options to own polls"
  ON poll_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid()
  ));

CREATE POLICY "Users can update options of own polls"
  ON poll_options FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete options of own polls"
  ON poll_options FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid()
  ));

CREATE INDEX idx_polls_user_id ON polls(user_id);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  vote_count: number;
  position: number;
  created_at: string;
}

export interface Poll {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  is_favorite: boolean;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
  options: PollOption[];  // joined client-side
}

export type PollInput = {
  title: string;
  description: string;
  status: "open" | "closed";
  is_favorite: boolean;
  closes_at: string | null;
  options: string[];  // just labels for creation
};
```

## Service Functions

```ts
// lib/services/polls.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Poll, PollOption, PollInput } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getPolls(
  supabase: SupabaseClient,
  userId: string
): Promise<Poll[]>;
// Fetch polls, then fetch all options for those polls
// Join options into their polls client-side
// Order polls by updated_at DESC, options by position ASC

export async function createPoll(
  supabase: SupabaseClient,
  userId: string,
  input: PollInput
): Promise<Poll>;
// 1. Insert poll row
// 2. Insert option rows with position = index
// 3. Return poll with options

export async function updatePoll(
  supabase: SupabaseClient,
  pollId: string,
  input: { title?: string; description?: string; status?: "open" | "closed"; is_favorite?: boolean; closes_at?: string | null }
): Promise<Poll>;
// Only updates poll metadata, not options

export async function deletePoll(
  supabase: SupabaseClient,
  pollId: string
): Promise<void>;
// CASCADE deletes options automatically

export async function voteOnOption(
  supabase: SupabaseClient,
  optionId: string
): Promise<PollOption>;
// Increment vote_count by 1

export async function resetVotes(
  supabase: SupabaseClient,
  pollId: string
): Promise<void>;
// Set all option vote_counts to 0 for this poll
```

## Hook

```ts
// hooks/use-polls.ts

export function usePolls() {
  return {
    polls: Poll[];
    loading: boolean;
    error: string | null;
    createPoll: (input: PollInput) => Promise<Poll | undefined>;
    updatePoll: (id: string, input: Partial<PollInput>) => Promise<Poll | undefined>;
    deletePoll: (id: string) => Promise<void>;
    toggleFavorite: (poll: Poll) => Promise<void>;  // optimistic update
    vote: (pollId: string, optionId: string) => Promise<void>;  // optimistic increment
    resetVotes: (pollId: string) => Promise<void>;
    refetch: () => Promise<void>;
  };
}
```

## Components

### PollCard

```
components/poll-card.tsx
```

- Displays: title, description (truncated), status badge (open/closed), total votes count
- Each option shown as a horizontal bar with label, vote count, and percentage
- Bar width = (option votes / total votes) * 100%
- Vote button on each option (only if poll is open)
- Actions: favorite toggle, close/reopen poll, reset votes, edit, delete

### PollForm

```
components/poll-form.tsx
```

Dialog form with fields:
- Title (text input, required)
- Description (textarea, optional)
- Options (dynamic list — minimum 2, maximum 10)
  - Each option has a text input and a remove button
  - "Add Option" button at bottom
- Closes At (datetime input, optional)
- Status (select: open / closed)

### Skeleton

```ts
// Add to components/skeletons.tsx

export function PollCardSkeleton() {
  // Card with: title, description, status badge, 3-4 option bars with percentages
}
```

## Page Layout

```
app/(app)/polls/page.tsx
```

```
┌──────────────────────────────────────────┐
│ Polls                      [+ Create Poll]│
├──────────────────────────────────────────┤
│ [Search...]  [All ▼]  [★ Favorites]     │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ Best Frontend Framework?    [Open] │   │
│ │ What should we use for the next... │   │
│ │ ████████████████░░░░ React    60%  │   │
│ │ ████████░░░░░░░░░░░░ Vue     30%  │   │
│ │ ███░░░░░░░░░░░░░░░░░ Svelte  10%  │   │
│ │ Total: 20 votes                    │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ Lunch spot?              [Closed]  │   │
│ │ ...                                │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

- Single-column layout (polls are wide with bars)
- Filter by status (all/open/closed), search by title, favorites toggle

## Navigation

```ts
// In config/navigation.ts
import { BarChart3 } from "lucide-react";

{
  title: "Polls",
  href: "/polls",
  icon: BarChart3,
}
```

## Config Files

None needed.

## npm Packages

None needed.

## Logic Notes

### Vote Percentage Calculation

```ts
function getPercentage(optionVotes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return Math.round((optionVotes / totalVotes) * 100);
}
```

### Optimistic Voting

1. Optimistically increment the option's vote_count in local state
2. Call `voteOnOption` service
3. On error, revert the local state and show `toast.error()`

### Dynamic Options in Form

- Start with 2 empty option inputs
- "Add Option" button appends a new input (max 10)
- Remove button on each option (min 2 must remain)
- Options are submitted as an array of labels

### Poll Auto-Close

- If `closes_at` is set and in the past, treat as closed regardless of `status` field
- Show "Closes in X hours/days" on the card if `closes_at` is in the future
