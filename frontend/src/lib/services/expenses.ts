import { api } from "@/lib/api/client";
import type { Expense, ExpenseInput } from "@/lib/types/database";

export async function getExpenses(): Promise<Expense[]> {
  return api.get<Expense[]>("/api/expenses");
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  return api.post<Expense>("/api/expenses", input);
}

export async function updateExpense(
  id: string,
  input: ExpenseInput
): Promise<Expense> {
  return api.put<Expense>(`/api/expenses/${id}`, input);
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/api/expenses/${id}`);
}
