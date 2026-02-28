import { api } from "@/lib/api/client";
import type { EnvVault, EnvVaultInput, EnvVariable, EnvVariableInput } from "@/lib/types/database";

export async function getEnvVaults(): Promise<EnvVault[]> {
  return api.get<EnvVault[]>("/api/env-vaults");
}

export async function getEnvVault(id: string): Promise<EnvVault> {
  return api.get<EnvVault>(`/api/env-vaults/${id}`);
}

export async function createEnvVault(input: EnvVaultInput): Promise<EnvVault> {
  return api.post<EnvVault>("/api/env-vaults", input);
}

export async function updateEnvVault(id: string, input: EnvVaultInput): Promise<EnvVault> {
  return api.put<EnvVault>(`/api/env-vaults/${id}`, input);
}

export async function deleteEnvVault(id: string): Promise<void> {
  await api.delete(`/api/env-vaults/${id}`);
}

export async function addEnvVariable(vaultId: string, input: EnvVariableInput): Promise<EnvVariable> {
  return api.post<EnvVariable>(`/api/env-vaults/${vaultId}/variables`, input);
}

export async function updateEnvVariable(id: string, input: EnvVariableInput): Promise<EnvVariable> {
  return api.put<EnvVariable>(`/api/env-variables/${id}`, input);
}

export async function deleteEnvVariable(id: string): Promise<void> {
  await api.delete(`/api/env-variables/${id}`);
}

export async function importEnvVariables(vaultId: string, raw: string): Promise<EnvVariable[]> {
  return api.post<EnvVariable[]>(`/api/env-vaults/${vaultId}/import`, { raw });
}
