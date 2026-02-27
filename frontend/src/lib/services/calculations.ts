import { api } from "@/lib/api/client";
import type { Calculation, CalculationInput } from "@/lib/types/database";

export async function getCalculations(): Promise<Calculation[]> {
  return api.get<Calculation[]>("/api/calculations");
}

export async function createCalculation(
  input: CalculationInput
): Promise<Calculation> {
  return api.post<Calculation>("/api/calculations", input);
}

export async function deleteCalculation(id: string): Promise<void> {
  await api.delete(`/api/calculations/${id}`);
}

export async function clearCalculations(): Promise<void> {
  await api.delete("/api/calculations");
}
