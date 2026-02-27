# Module 08 — Kanban Board

> Difficulty: ⭐⭐⭐ | Two new tables | New packages: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

## Overview

A drag-and-drop Kanban board for task management. Users create boards with customizable columns (e.g., To Do, In Progress, Done) and cards that can be dragged between columns and reordered within columns.

## Supabase SQL

```sql
-- Kanban boards (each board has columns and cards)
CREATE TABLE kanban_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Kanban columns
CREATE TABLE kanban_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280' NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Kanban cards
CREATE TABLE kanban_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID REFERENCES kanban_columns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  priority TEXT DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  labels TEXT[] DEFAULT '{}' NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;

-- Boards RLS
CREATE POLICY "Users can view own boards"
  ON kanban_boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boards"
  ON kanban_boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards"
  ON kanban_boards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards"
  ON kanban_boards FOR DELETE
  USING (auth.uid() = user_id);

-- Columns RLS (through board ownership)
CREATE POLICY "Users can view own columns"
  ON kanban_columns FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kanban_boards WHERE kanban_boards.id = kanban_columns.board_id AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own columns"
  ON kanban_columns FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM kanban_boards WHERE kanban_boards.id = kanban_columns.board_id AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own columns"
  ON kanban_columns FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM kanban_boards WHERE kanban_boards.id = kanban_columns.board_id AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own columns"
  ON kanban_columns FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM kanban_boards WHERE kanban_boards.id = kanban_columns.board_id AND kanban_boards.user_id = auth.uid()
  ));

-- Cards RLS (through column → board ownership)
CREATE POLICY "Users can view own cards"
  ON kanban_cards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    WHERE kanban_columns.id = kanban_cards.column_id AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own cards"
  ON kanban_cards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    WHERE kanban_columns.id = kanban_cards.column_id AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own cards"
  ON kanban_cards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    WHERE kanban_columns.id = kanban_cards.column_id AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own cards"
  ON kanban_cards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    WHERE kanban_columns.id = kanban_cards.column_id AND kanban_boards.user_id = auth.uid()
  ));

CREATE INDEX idx_kanban_boards_user_id ON kanban_boards(user_id);
CREATE INDEX idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX idx_kanban_cards_column_id ON kanban_cards(column_id);
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface KanbanBoard {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type KanbanBoardInput = Pick<
  KanbanBoard,
  "title" | "description" | "is_favorite"
>;

export interface KanbanColumn {
  id: string;
  board_id: string;
  title: string;
  color: string;
  position: number;
  created_at: string;
}

export type KanbanColumnInput = Pick<KanbanColumn, "title" | "color">;

export interface KanbanCard {
  id: string;
  column_id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  labels: string[];
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type KanbanCardInput = Pick<
  KanbanCard,
  "title" | "description" | "priority" | "labels" | "due_date"
>;

// Enriched column with cards (used in UI)
export interface KanbanColumnWithCards extends KanbanColumn {
  cards: KanbanCard[];
}

// Enriched board with columns and cards
export interface KanbanBoardFull extends KanbanBoard {
  columns: KanbanColumnWithCards[];
}
```

## Service Functions

```ts
// lib/services/kanban.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  KanbanBoard, KanbanBoardInput,
  KanbanColumn, KanbanColumnInput,
  KanbanCard, KanbanCardInput,
} from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

// --- Board operations ---

export async function getBoards(
  supabase: SupabaseClient,
  userId: string
): Promise<KanbanBoard[]>;

export async function createBoard(
  supabase: SupabaseClient,
  userId: string,
  input: KanbanBoardInput
): Promise<KanbanBoard>;
// Also create 3 default columns: To Do (position 0), In Progress (1), Done (2)

export async function updateBoard(
  supabase: SupabaseClient,
  boardId: string,
  input: Partial<KanbanBoardInput>
): Promise<KanbanBoard>;

export async function deleteBoard(
  supabase: SupabaseClient,
  boardId: string
): Promise<void>;

// --- Column operations ---

export async function getColumnsWithCards(
  supabase: SupabaseClient,
  boardId: string
): Promise<KanbanColumnWithCards[]>;
// Fetch columns (order by position ASC)
// Fetch all cards for those columns (order by position ASC)
// Join cards into their columns

export async function createColumn(
  supabase: SupabaseClient,
  boardId: string,
  input: KanbanColumnInput,
  position: number
): Promise<KanbanColumn>;

export async function updateColumn(
  supabase: SupabaseClient,
  columnId: string,
  input: Partial<KanbanColumnInput>
): Promise<KanbanColumn>;

export async function deleteColumn(
  supabase: SupabaseClient,
  columnId: string
): Promise<void>;

export async function reorderColumns(
  supabase: SupabaseClient,
  updates: { id: string; position: number }[]
): Promise<void>;
// Batch update positions

// --- Card operations ---

export async function createCard(
  supabase: SupabaseClient,
  columnId: string,
  input: KanbanCardInput,
  position: number
): Promise<KanbanCard>;

export async function updateCard(
  supabase: SupabaseClient,
  cardId: string,
  input: Partial<KanbanCardInput>
): Promise<KanbanCard>;

export async function deleteCard(
  supabase: SupabaseClient,
  cardId: string
): Promise<void>;

export async function moveCard(
  supabase: SupabaseClient,
  cardId: string,
  newColumnId: string,
  newPosition: number
): Promise<KanbanCard>;
// Update column_id and position

export async function reorderCards(
  supabase: SupabaseClient,
  updates: { id: string; column_id: string; position: number }[]
): Promise<void>;
// Batch update positions after drag-and-drop
```

## Hook

```ts
// hooks/use-kanban.ts

export function useKanban() {
  return {
    // Board list
    boards: KanbanBoard[];
    loading: boolean;
    error: string | null;
    createBoard: (input: KanbanBoardInput) => Promise<KanbanBoard | undefined>;
    updateBoard: (id: string, input: Partial<KanbanBoardInput>) => Promise<KanbanBoard | undefined>;
    deleteBoard: (id: string) => Promise<void>;
    toggleFavorite: (board: KanbanBoard) => Promise<void>;

    // Selected board detail
    selectedBoard: KanbanBoardFull | null;
    boardLoading: boolean;
    selectBoard: (boardId: string | null) => void;

    // Column operations
    createColumn: (input: KanbanColumnInput) => Promise<KanbanColumn | undefined>;
    updateColumn: (id: string, input: Partial<KanbanColumnInput>) => Promise<KanbanColumn | undefined>;
    deleteColumn: (id: string) => Promise<void>;

    // Card operations
    createCard: (columnId: string, input: KanbanCardInput) => Promise<KanbanCard | undefined>;
    updateCard: (id: string, input: Partial<KanbanCardInput>) => Promise<KanbanCard | undefined>;
    deleteCard: (id: string) => Promise<void>;
    moveCard: (cardId: string, newColumnId: string, newPosition: number) => Promise<void>;

    refetch: () => Promise<void>;
  };
}
```

## Components

### KanbanBoardCard

```
components/kanban-board-card.tsx
```

- Displays: title, description, column count, total card count
- Actions: favorite toggle, edit, delete
- Click to open board

### KanbanBoardForm

```
components/kanban-board-form.tsx
```

Dialog form:
- Title (text input, required)
- Description (textarea, optional)

### KanbanColumnHeader

```
components/kanban-column-header.tsx
```

- Column title with color indicator
- Card count badge
- "Add Card" button
- Actions dropdown: rename, change color, delete column

### KanbanCardItem

```
components/kanban-card-item.tsx
```

- Draggable card using @dnd-kit
- Displays: title, priority indicator (colored dot/border), labels as small badges, due date (if set)
- Click to open edit dialog
- Drag handle

### KanbanCardForm

```
components/kanban-card-form.tsx
```

Dialog form:
- Title (text input, required)
- Description (textarea, optional)
- Priority (select: low, medium, high, urgent)
- Labels (tag input)
- Due Date (date input, optional)

### KanbanBoardView

```
components/kanban-board-view.tsx
```

The main board layout — horizontal scrollable area with columns:
- Uses `@dnd-kit/core` for drag context
- Uses `@dnd-kit/sortable` for sortable columns and cards
- Columns are horizontal, cards are vertical within columns
- "Add Column" button at the end

### Skeleton

```ts
// Add to components/skeletons.tsx

export function KanbanBoardCardSkeleton() {
  // Card with: title, description, column/card counts
}
```

## Page Layout

```
app/(app)/kanban/page.tsx
```

### Board List View (default)

```
┌──────────────────────────────────────────┐
│ Kanban                    [+ New Board]  │
├──────────────────────────────────────────┤
│ [Search...]  [★ Favorites]              │
├──────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Project │ │ Sprint  │ │ Personal│    │
│ │ Alpha   │ │ Board   │ │ Tasks   │    │
│ │ 3 cols  │ │ 4 cols  │ │ 3 cols  │    │
│ │ 12 cards│ │ 8 cards │ │ 5 cards │    │
│ └─────────┘ └─────────┘ └─────────┘    │
└──────────────────────────────────────────┘
```

### Board Detail View

```
┌──────────────────────────────────────────────────────────┐
│ [← Back]  Project Alpha                [+ Add Column]   │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│ │ To Do    │  │In Progress│  │  Done    │               │
│ │ (5)      │  │ (3)      │  │  (4)     │               │
│ │┌────────┐│  │┌────────┐│  │┌────────┐│               │
│ ││ Card 1 ││  ││ Card 4 ││  ││ Card 8 ││               │
│ │├────────┤│  │├────────┤│  │├────────┤│               │
│ ││ Card 2 ││  ││ Card 5 ││  ││ Card 9 ││               │
│ │├────────┤│  │├────────┤│  │├────────┤│               │
│ ││ Card 3 ││  ││ Card 6 ││  ││Card 10 ││               │
│ │├────────┤│  │└────────┘│  │├────────┤│               │
│ ││ Card 4 ││  │          │  ││Card 11 ││               │
│ │├────────┤│  │[+ Add]   │  │└────────┘│               │
│ ││ Card 5 ││  │          │  │          │               │
│ │└────────┘│  │          │  │[+ Add]   │               │
│ │          │  │          │  │          │               │
│ │[+ Add]   │  │          │  │          │               │
│ └──────────┘  └──────────┘  └──────────┘               │
│                                      ← scroll →         │
└──────────────────────────────────────────────────────────┘
```

- Horizontal scroll for many columns
- Cards are draggable between columns and reorderable within columns
- Each column scrolls vertically if many cards

## Navigation

```ts
// In config/navigation.ts
import { Kanban } from "lucide-react";

{
  title: "Kanban",
  href: "/kanban",
  icon: Kanban,
}
```

## Config Files

```ts
// config/kanban-config.ts

export const cardPriorities = [
  { value: "low", label: "Low", color: "bg-blue-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
] as const;

export type CardPriority = (typeof cardPriorities)[number]["value"];

export const defaultColumns = [
  { title: "To Do", color: "#6b7280" },
  { title: "In Progress", color: "#3b82f6" },
  { title: "Done", color: "#10b981" },
] as const;

export const columnColors = [
  { value: "#6b7280", label: "Gray" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
] as const;
```

## npm Packages

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Logic Notes

### Drag and Drop with @dnd-kit

```tsx
import { DndContext, closestCorners, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
```

**Key concepts:**
- `DndContext` wraps the entire board
- Each column is a `SortableContext` with `verticalListSortingStrategy`
- Each card uses `useSortable` hook
- `onDragEnd` handles both reordering within a column and moving between columns

### onDragEnd Logic

```ts
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;

  const activeCard = findCard(active.id);
  const overColumn = findColumn(over.id) || findCardColumn(over.id);

  if (!activeCard || !overColumn) return;

  // 1. Calculate new position
  // 2. Optimistically update local state
  // 3. Call moveCard/reorderCards service
  // 4. On error, revert and toast
}
```

### Position Management

- Positions are integers (0, 1, 2, ...)
- When moving a card, recalculate positions for all cards in affected columns
- Use batch update (`reorderCards`) to persist new positions
- Optimistic: update local state immediately, persist in background

### Default Board Creation

When creating a new board, automatically create 3 default columns:
1. To Do (position 0, gray)
2. In Progress (position 1, blue)
3. Done (position 2, green)

### Drag Overlay

Use `DragOverlay` from @dnd-kit to show a preview of the card being dragged. This prevents layout shift during drag.

### Mobile Considerations

On mobile (< 768px), columns stack vertically or use horizontal scroll with snap. Cards can still be moved between columns using a "Move to..." dropdown as an alternative to drag-and-drop.
