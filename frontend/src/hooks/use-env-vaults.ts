"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getEnvVaults,
  createEnvVault as createVaultService,
  updateEnvVault as updateVaultService,
  deleteEnvVault as deleteVaultService,
  addEnvVariable as addVariableService,
  updateEnvVariable as updateVariableService,
  deleteEnvVariable as deleteVariableService,
  importEnvVariables as importVariablesService,
} from "@/lib/services/env-vaults";
import { useAuth } from "@/providers/auth-provider";
import type { EnvVault, EnvVaultInput, EnvVariableInput } from "@/lib/types/database";

export function useEnvVaults() {
  const { user, loading: authLoading } = useAuth();
  const [vaults, setVaults] = useState<EnvVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchVaults = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getEnvVaults();
      if (mountedRef.current) {
        setVaults(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch vaults");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const createVault = useCallback(
    async (input: EnvVaultInput) => {
      if (!user) return;
      const created = await createVaultService(input);
      if (mountedRef.current) {
        setVaults((prev) => [created, ...prev]);
        toast.success("Vault created");
      }
      return created;
    },
    [user]
  );

  const updateVault = useCallback(
    async (vaultId: string, input: EnvVaultInput) => {
      const updated = await updateVaultService(vaultId, input);
      if (mountedRef.current) {
        setVaults((prev) =>
          prev.map((v) => (v.id === vaultId ? updated : v))
        );
        toast.success("Vault updated");
      }
      return updated;
    },
    []
  );

  const deleteVault = useCallback(
    async (vaultId: string) => {
      await deleteVaultService(vaultId);
      if (mountedRef.current) {
        setVaults((prev) => prev.filter((v) => v.id !== vaultId));
        toast.success("Vault deleted");
      }
    },
    []
  );

  const toggleFavorite = useCallback(
    async (vault: EnvVault) => {
      const newValue = !vault.is_favorite;
      setVaults((prev) =>
        prev.map((v) =>
          v.id === vault.id ? { ...v, is_favorite: newValue } : v
        )
      );
      try {
        await updateVaultService(vault.id, {
          name: vault.name,
          environment: vault.environment,
          description: vault.description,
          is_favorite: newValue,
        });
      } catch {
        if (mountedRef.current) {
          setVaults((prev) =>
            prev.map((v) =>
              v.id === vault.id ? { ...v, is_favorite: vault.is_favorite } : v
            )
          );
          toast.error("Failed to update favorite");
        }
      }
    },
    []
  );

  const addVariable = useCallback(
    async (vaultId: string, input: EnvVariableInput) => {
      const variable = await addVariableService(vaultId, input);
      if (mountedRef.current) {
        setVaults((prev) =>
          prev.map((v) =>
            v.id === vaultId
              ? { ...v, variables: [...v.variables, variable] }
              : v
          )
        );
        toast.success("Variable added");
      }
    },
    []
  );

  const updateVariable = useCallback(
    async (vaultId: string, varId: string, input: EnvVariableInput) => {
      const updated = await updateVariableService(varId, input);
      if (mountedRef.current) {
        setVaults((prev) =>
          prev.map((v) =>
            v.id === vaultId
              ? {
                  ...v,
                  variables: v.variables.map((ev) =>
                    ev.id === varId ? updated : ev
                  ),
                }
              : v
          )
        );
        toast.success("Variable updated");
      }
    },
    []
  );

  const deleteVariable = useCallback(
    async (vaultId: string, varId: string) => {
      await deleteVariableService(varId);
      if (mountedRef.current) {
        setVaults((prev) =>
          prev.map((v) =>
            v.id === vaultId
              ? {
                  ...v,
                  variables: v.variables.filter((ev) => ev.id !== varId),
                }
              : v
          )
        );
        toast.success("Variable deleted");
      }
    },
    []
  );

  const importVariables = useCallback(
    async (vaultId: string, raw: string) => {
      const imported = await importVariablesService(vaultId, raw);
      if (mountedRef.current) {
        // Refetch to get the full updated vault with all variables
        await fetchVaults();
        toast.success(`Imported ${imported.length} variable${imported.length !== 1 ? "s" : ""}`);
      }
    },
    [fetchVaults]
  );

  return {
    vaults,
    loading,
    error,
    createVault,
    updateVault,
    deleteVault,
    toggleFavorite,
    addVariable,
    updateVariable,
    deleteVariable,
    importVariables,
    refetch: fetchVaults,
  };
}
