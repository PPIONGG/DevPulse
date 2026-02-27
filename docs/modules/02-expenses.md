# Module 02 — Expense Tracker

> Difficulty: ⭐⭐ | New table | No new packages

## Overview

Track personal and work expenses with categories, amounts, and dates. Includes monthly summaries and category breakdowns. Standard CRUD pattern matching existing modules.

## Supabase SQL

```sql
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '' NOT NULL,
  is_recurring BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  notes: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export type ExpenseInput = Pick<
  Expense,
  "title" | "amount" | "currency" | "category" | "date" | "notes" | "is_recurring"
>;
```

## Service Functions

```ts
// lib/services/expenses.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseInput } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getExpenses(
  supabase: SupabaseClient,
  userId: string
): Promise<Expense[]>;
// Order by date DESC

export async function createExpense(
  supabase: SupabaseClient,
  userId: string,
  input: ExpenseInput
): Promise<Expense>;

export async function updateExpense(
  supabase: SupabaseClient,
  expenseId: string,
  input: Partial<ExpenseInput>
): Promise<Expense>;

export async function deleteExpense(
  supabase: SupabaseClient,
  expenseId: string
): Promise<void>;
```

## Hook

```ts
// hooks/use-expenses.ts

export function useExpenses() {
  return {
    expenses: Expense[];
    loading: boolean;
    error: string | null;
    createExpense: (input: ExpenseInput) => Promise<Expense | undefined>;
    updateExpense: (id: string, input: Partial<ExpenseInput>) => Promise<Expense | undefined>;
    deleteExpense: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
  };
}
```

## Components

### ExpenseCard

```
components/expense-card.tsx
```

- Displays: title, formatted amount (with currency symbol), category badge, date
- Actions: edit button, delete button (with confirmation)
- Recurring indicator icon if `is_recurring` is true
- Color-coded by category

### ExpenseForm

```
components/expense-form.tsx
```

Dialog form with fields:
- Title (text input, required)
- Amount (number input, required, min 0, step 0.01)
- Currency (select: USD, EUR, GBP, THB — default USD)
- Category (select from config)
- Date (date input, default today)
- Notes (textarea, optional)
- Is Recurring (checkbox)

### ExpenseSummary

```
components/expense-summary.tsx
```

- Total for current month
- Breakdown by category (small bar chart or list with percentages)
- Computed client-side from the expenses array

### Skeleton

```ts
// Add to components/skeletons.tsx

export function ExpenseCardSkeleton() {
  // Card with: title skeleton, amount skeleton, category badge skeleton, date skeleton
}
```

## Page Layout

```
app/(app)/expenses/page.tsx
```

```
┌──────────────────────────────────────────┐
│ Expense Tracker              [+ Add New] │
├──────────────────────────────────────────┤
│ Monthly Summary                          │
│ Total: $1,234.56  |  Food: 40%  ...      │
├──────────────────────────────────────────┤
│ [Search...] [Category ▼] [Month ▼]      │
├──────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Expense │ │ Expense │ │ Expense │    │
│ │  Card   │ │  Card   │ │  Card   │    │
│ └─────────┘ └─────────┘ └─────────┘    │
│ ┌─────────┐ ┌─────────┐                │
│ │ Expense │ │ Expense │                │
│ │  Card   │ │  Card   │                │
│ └─────────┘ └─────────┘                │
└──────────────────────────────────────────┘
```

- Summary section at top
- Filter bar: search by title, filter by category, filter by month
- Grid of expense cards (responsive: 1/2/3 columns)

## Navigation

```ts
// In config/navigation.ts
import { DollarSign } from "lucide-react";

{
  title: "Expenses",
  href: "/expenses",
  icon: DollarSign,
}
```

## Config Files

```ts
// config/expense-categories.ts

export const expenseCategories = [
  { value: "food", label: "Food & Dining", color: "bg-orange-500" },
  { value: "transport", label: "Transportation", color: "bg-blue-500" },
  { value: "housing", label: "Housing & Rent", color: "bg-purple-500" },
  { value: "utilities", label: "Utilities", color: "bg-yellow-500" },
  { value: "entertainment", label: "Entertainment", color: "bg-pink-500" },
  { value: "shopping", label: "Shopping", color: "bg-green-500" },
  { value: "health", label: "Health & Medical", color: "bg-red-500" },
  { value: "education", label: "Education", color: "bg-indigo-500" },
  { value: "subscriptions", label: "Subscriptions", color: "bg-cyan-500" },
  { value: "other", label: "Other", color: "bg-gray-500" },
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number]["value"];

export const currencies = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "THB", label: "THB (฿)", symbol: "฿" },
] as const;
```

## npm Packages

None needed.

## Logic Notes

### Amount Formatting

```ts
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
```

### Monthly Summary Calculation

- Filter expenses by selected month
- Sum total amount
- Group by category, compute percentage of total
- Sort categories by amount descending

### Filtering

- Search: filter by title (case-insensitive includes)
- Category: filter by category value
- Month: filter by `date` field (YYYY-MM prefix match)
