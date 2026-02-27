# Module 01 — Calculator

> Difficulty: ⭐ | No database | No new packages

## Overview

A developer-friendly calculator with history. Supports basic arithmetic, percentage, and keyboard input. Calculation history is stored in Supabase so it persists across sessions.

## Supabase SQL

```sql
CREATE TABLE calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expression TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calculations"
  ON calculations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations"
  ON calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations"
  ON calculations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_calculations_user_id ON calculations(user_id);
CREATE INDEX idx_calculations_created_at ON calculations(created_at DESC);
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface Calculation {
  id: string;
  user_id: string;
  expression: string;
  result: string;
  created_at: string;
}

export type CalculationInput = Pick<Calculation, "expression" | "result">;
```

## Service Functions

```ts
// lib/services/calculations.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Calculation, CalculationInput } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getCalculations(
  supabase: SupabaseClient,
  userId: string
): Promise<Calculation[]>;

export async function createCalculation(
  supabase: SupabaseClient,
  userId: string,
  input: CalculationInput
): Promise<Calculation>;

export async function deleteCalculation(
  supabase: SupabaseClient,
  calculationId: string
): Promise<void>;

export async function clearCalculations(
  supabase: SupabaseClient,
  userId: string
): Promise<void>;
```

## Hook

```ts
// hooks/use-calculator.ts

export function useCalculator() {
  return {
    history: Calculation[];
    loading: boolean;
    error: string | null;
    calculate: (expression: string, result: string) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    refetch: () => Promise<void>;
  };
}
```

## Components

### Calculator Display + Keypad

```
components/calculator-display.tsx
```

- Large display area showing current input and previous result
- Keypad with buttons: 0-9, +, -, ×, ÷, %, ., =, C, ⌫
- Keyboard support: number keys, operators, Enter (=), Escape (clear), Backspace
- Use CSS grid for keypad layout (4 columns)

### Calculation History Sidebar

Part of the main page layout — a scrollable list of past calculations with expression and result. Each entry has a delete button on hover.

### No separate card/form components needed

The calculator is a single interactive widget, not a CRUD list. No dialog form needed.

## Page Layout

```
app/(app)/calculator/page.tsx
```

```
┌──────────────────────────────────────┐
│ Calculator                           │
├──────────────────┬───────────────────┤
│                  │                   │
│   [ Display ]    │   History         │
│   [  0.00   ]    │   3+2 = 5        │
│                  │   10/3 = 3.33     │
│   [7] [8] [9] [÷]│   ...            │
│   [4] [5] [6] [×]│                  │
│   [1] [2] [3] [-]│                  │
│   [0] [.] [=] [+]│   [Clear History]│
│                  │                   │
└──────────────────┴───────────────────┘
```

- Two-column layout on desktop (calculator left, history right)
- Stacked on mobile (calculator top, history below)

## Navigation

```ts
// In config/navigation.ts — add before Settings
import { Calculator } from "lucide-react";

{
  title: "Calculator",
  href: "/calculator",
  icon: Calculator,
}
```

## Config Files

None needed.

## npm Packages

None needed. Expression evaluation uses a simple recursive descent parser or `Function` constructor with sanitized input.

## Logic Notes

### Expression Evaluation

Use a safe evaluator — do NOT use raw `eval()`. Options:

1. **Simple approach:** Replace `×` with `*` and `÷` with `/`, then use `new Function("return " + sanitized)()` where `sanitized` only allows `[0-9+\-*/.()% ]`
2. **Better approach:** Write a small recursive descent parser that handles +, -, *, /, %, parentheses

### Display Formatting

- Show up to 10 significant digits
- Use `toLocaleString()` for thousand separators in result
- Show "Error" for invalid expressions (division by zero, syntax errors)

### Keyboard Handling

- Attach `keydown` listener to the page (not just the calculator div)
- Map: `Enter` → evaluate, `Escape` → clear, `Backspace` → delete last char
- Number keys and operator keys append to expression
