# Module 07 — Flashcards (SM-2)

> Difficulty: ⭐⭐⭐ | Two new tables | No new packages

## Overview

Spaced repetition flashcards using the SM-2 algorithm. Organize cards into decks, study them with a flip-card interface, and the algorithm schedules reviews at optimal intervals for long-term retention.

## Supabase SQL

```sql
-- Flashcard decks
CREATE TABLE flashcard_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  color TEXT DEFAULT '#3b82f6' NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Individual flashcards
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  -- SM-2 fields
  easiness_factor NUMERIC(4,2) DEFAULT 2.50 NOT NULL,
  repetition_count INTEGER DEFAULT 0 NOT NULL,
  interval_days INTEGER DEFAULT 0 NOT NULL,
  next_review_at DATE DEFAULT CURRENT_DATE NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Decks RLS
CREATE POLICY "Users can view own decks"
  ON flashcard_decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks"
  ON flashcard_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON flashcard_decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks"
  ON flashcard_decks FOR DELETE
  USING (auth.uid() = user_id);

-- Flashcards RLS (through deck ownership)
CREATE POLICY "Users can view own flashcards"
  ON flashcards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM flashcard_decks WHERE flashcard_decks.id = flashcards.deck_id AND flashcard_decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM flashcard_decks WHERE flashcard_decks.id = flashcards.deck_id AND flashcard_decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own flashcards"
  ON flashcards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM flashcard_decks WHERE flashcard_decks.id = flashcards.deck_id AND flashcard_decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own flashcards"
  ON flashcards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM flashcard_decks WHERE flashcard_decks.id = flashcards.deck_id AND flashcard_decks.user_id = auth.uid()
  ));

CREATE INDEX idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review_at);
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  description: string;
  color: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type FlashcardDeckInput = Pick<
  FlashcardDeck,
  "title" | "description" | "color" | "is_favorite"
>;

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  easiness_factor: number;
  repetition_count: number;
  interval_days: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type FlashcardInput = Pick<Flashcard, "front" | "back">;

// Quality rating for SM-2 (0-5)
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

// Enriched deck with card counts
export interface FlashcardDeckWithStats extends FlashcardDeck {
  totalCards: number;
  dueCards: number;
}
```

## Service Functions

```ts
// lib/services/flashcards.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FlashcardDeck, FlashcardDeckInput,
  Flashcard, FlashcardInput
} from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

// --- Deck operations ---

export async function getDecks(
  supabase: SupabaseClient,
  userId: string
): Promise<FlashcardDeck[]>;

export async function createDeck(
  supabase: SupabaseClient,
  userId: string,
  input: FlashcardDeckInput
): Promise<FlashcardDeck>;

export async function updateDeck(
  supabase: SupabaseClient,
  deckId: string,
  input: Partial<FlashcardDeckInput>
): Promise<FlashcardDeck>;

export async function deleteDeck(
  supabase: SupabaseClient,
  deckId: string
): Promise<void>;

// --- Card operations ---

export async function getCards(
  supabase: SupabaseClient,
  deckId: string
): Promise<Flashcard[]>;

export async function getDueCards(
  supabase: SupabaseClient,
  deckId: string
): Promise<Flashcard[]>;
// WHERE next_review_at <= CURRENT_DATE

export async function createCard(
  supabase: SupabaseClient,
  deckId: string,
  input: FlashcardInput
): Promise<Flashcard>;

export async function updateCard(
  supabase: SupabaseClient,
  cardId: string,
  input: Partial<FlashcardInput>
): Promise<Flashcard>;

export async function deleteCard(
  supabase: SupabaseClient,
  cardId: string
): Promise<void>;

export async function reviewCard(
  supabase: SupabaseClient,
  cardId: string,
  sm2Result: { easiness_factor: number; repetition_count: number; interval_days: number; next_review_at: string }
): Promise<Flashcard>;
// Updates SM-2 fields + last_reviewed_at
```

## Hook

```ts
// hooks/use-flashcards.ts

export function useFlashcards() {
  return {
    decks: FlashcardDeckWithStats[];
    loading: boolean;
    error: string | null;
    // Deck operations
    createDeck: (input: FlashcardDeckInput) => Promise<FlashcardDeck | undefined>;
    updateDeck: (id: string, input: Partial<FlashcardDeckInput>) => Promise<FlashcardDeck | undefined>;
    deleteDeck: (id: string) => Promise<void>;
    toggleFavorite: (deck: FlashcardDeck) => Promise<void>;
    // Card operations (for selected deck)
    selectedDeck: FlashcardDeck | null;
    cards: Flashcard[];
    dueCards: Flashcard[];
    selectDeck: (deckId: string | null) => void;
    createCard: (input: FlashcardInput) => Promise<Flashcard | undefined>;
    updateCard: (id: string, input: Partial<FlashcardInput>) => Promise<Flashcard | undefined>;
    deleteCard: (id: string) => Promise<void>;
    reviewCard: (cardId: string, quality: SM2Quality) => Promise<void>;
    refetch: () => Promise<void>;
  };
}
```

## Components

### FlashcardDeckCard

```
components/flashcard-deck-card.tsx
```

- Displays: title, description, card count, due count badge
- Color indicator (top border or left stripe)
- "Study Now" button (if due cards > 0)
- Actions: favorite toggle, edit, delete
- Click card to view/manage cards in deck

### FlashcardDeckForm

```
components/flashcard-deck-form.tsx
```

Dialog form with fields:
- Title (text input, required)
- Description (textarea, optional)
- Color (color picker — same 8 presets as habits)

### FlashcardForm

```
components/flashcard-form.tsx
```

Dialog form for creating/editing a card within a deck:
- Front (textarea, required — the question/prompt)
- Back (textarea, required — the answer)

### StudySession

```
components/study-session.tsx
```

Full-screen (or large dialog) study interface:
- Shows one card at a time
- Card shows front initially, click/button to flip to back
- After seeing the answer, rate quality: Again (0), Hard (2), Good (3), Easy (5)
- Progress indicator: "Card 3 of 12"
- Summary screen at end showing reviewed count and stats

### Skeleton

```ts
// Add to components/skeletons.tsx

export function FlashcardDeckSkeleton() {
  // Card with: title, description, card count badge, due count badge
}
```

## Page Layout

```
app/(app)/flashcards/page.tsx
```

### Deck List View (default)

```
┌──────────────────────────────────────────┐
│ Flashcards                  [+ New Deck] │
├──────────────────────────────────────────┤
│ [Search...]  [★ Favorites]              │
├──────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ TypeScript│ │ Go Lang │ │ SQL     │    │
│ │ 45 cards │ │ 30 cards│ │ 20 cards│    │
│ │ 8 due    │ │ 3 due   │ │ 0 due   │    │
│ │[Study Now]│ │[Study]  │ │         │    │
│ └─────────┘ └─────────┘ └─────────┘    │
└──────────────────────────────────────────┘
```

### Deck Detail View (when deck selected)

```
┌──────────────────────────────────────────┐
│ [← Back] TypeScript Deck    [+ Add Card] │
│ 45 cards · 8 due today                  │
│ [Study Due Cards]                        │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ Q: What is a union type?           │   │
│ │ A: A type that can be one of...    │   │
│ │ Due: Tomorrow  |  EF: 2.5         │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ Q: What is `keyof`?               │   │
│ │ A: Returns union of keys...        │   │
│ │ Due: In 3 days  |  EF: 2.8        │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### Study Mode (dialog/fullscreen)

```
┌──────────────────────────────────────────┐
│ Studying: TypeScript       Card 3 of 8   │
├──────────────────────────────────────────┤
│                                          │
│     ┌──────────────────────────┐         │
│     │                          │         │
│     │  What is a union type    │         │
│     │  in TypeScript?          │         │
│     │                          │         │
│     │     [Tap to flip]        │         │
│     │                          │         │
│     └──────────────────────────┘         │
│                                          │
│  [Again]   [Hard]   [Good]   [Easy]     │
│                                          │
└──────────────────────────────────────────┘
```

## Navigation

```ts
// In config/navigation.ts
import { Layers } from "lucide-react";

{
  title: "Flashcards",
  href: "/flashcards",
  icon: Layers,
}
```

## Config Files

Uses same `habitColors` from `config/habit-colors.ts` for deck colors, or define shared `config/colors.ts`.

## npm Packages

None needed.

## Logic Notes

### SM-2 Algorithm

```ts
/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings:
 *   0 - Complete blackout
 *   1 - Incorrect, but remembered upon seeing answer
 *   2 - Incorrect, but answer seemed easy to recall
 *   3 - Correct, but with significant difficulty
 *   4 - Correct, after some hesitation
 *   5 - Perfect response
 *
 * @param quality - Rating 0-5
 * @param prevEF - Previous easiness factor (>= 1.3)
 * @param prevRep - Previous repetition count
 * @param prevInterval - Previous interval in days
 */
function sm2(
  quality: number,
  prevEF: number,
  prevRep: number,
  prevInterval: number
): { ef: number; rep: number; interval: number } {
  let ef = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ef = Math.max(1.3, ef);  // minimum EF is 1.3

  let rep: number;
  let interval: number;

  if (quality < 3) {
    // Failed — reset
    rep = 0;
    interval = 1;
  } else {
    rep = prevRep + 1;
    if (rep === 1) {
      interval = 1;
    } else if (rep === 2) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * ef);
    }
  }

  return { ef, rep, interval };
}
```

### next_review_at Calculation

```ts
const today = new Date();
const nextReview = new Date(today);
nextReview.setDate(today.getDate() + result.interval);
// Format as YYYY-MM-DD for the database
```

### Study Session Flow

1. Fetch due cards for the deck (`next_review_at <= today`)
2. Show cards one at a time (front → flip → back)
3. User rates quality (Again/Hard/Good/Easy → maps to 0/2/3/5)
4. Run SM-2 algorithm with current card's EF, rep, interval
5. Update card in database with new SM-2 values
6. Move to next card
7. Show summary at end

### Quality Button Mapping

| Button | Quality | Description |
|--------|---------|-------------|
| Again | 0 | Didn't know it — review again today |
| Hard | 2 | Got it wrong but remembered seeing answer |
| Good | 3 | Got it right with some effort |
| Easy | 5 | Knew it instantly |
