export const expenseCategories = [
  { value: "food", label: "Food & Dining", color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950" },
  { value: "transport", label: "Transportation", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950" },
  { value: "housing", label: "Housing & Rent", color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950" },
  { value: "utilities", label: "Utilities", color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950" },
  { value: "entertainment", label: "Entertainment", color: "text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-950" },
  { value: "shopping", label: "Shopping", color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950" },
  { value: "health", label: "Health & Medical", color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950" },
  { value: "education", label: "Education", color: "text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950" },
  { value: "subscriptions", label: "Subscriptions", color: "text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950" },
  { value: "other", label: "Other", color: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950" },
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number]["value"];

export function getCategoryConfig(value: string) {
  return expenseCategories.find((c) => c.value === value) ?? expenseCategories[9];
}

export const currencies = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "THB", label: "THB (฿)", symbol: "฿" },
] as const;

export function getCurrencySymbol(code: string): string {
  return currencies.find((c) => c.value === code)?.symbol ?? code;
}

export function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;
  }
}
