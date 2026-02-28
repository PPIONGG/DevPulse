"use client";

import { useState, useMemo } from "react";
import { Plus, Search, KeyRound, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VaultCard } from "@/components/vault-card";
import { VaultForm } from "@/components/vault-form";
import { VaultDetail } from "@/components/vault-detail";
import { VaultCardSkeleton } from "@/components/skeletons";
import { useEnvVaults } from "@/hooks/use-env-vaults";
import { environments } from "@/config/environments";
import { toast } from "sonner";
import { useTranslation } from "@/providers/language-provider";
import type { EnvVault, EnvVaultInput } from "@/lib/types/database";

export default function EnvVaultPage() {
  const {
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
    refetch,
  } = useEnvVaults();

  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVault, setEditingVault] = useState<EnvVault | null>(null);
  const [deletingVault, setDeletingVault] = useState<EnvVault | null>(null);
  const [expandedVaultId, setExpandedVaultId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = vaults;
    if (envFilter !== "all") {
      result = result.filter((v) => v.environment === envFilter);
    }
    if (showFavorites) {
      result = result.filter((v) => v.is_favorite);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [vaults, search, envFilter, showFavorites]);

  const hasFilters = search.trim() || envFilter !== "all" || showFavorites;

  const handleCreate = async (data: EnvVaultInput) => {
    await createVault(data);
  };

  const handleEdit = (vault: EnvVault) => {
    setEditingVault(vault);
    setFormOpen(true);
  };

  const handleUpdate = async (data: EnvVaultInput) => {
    if (!editingVault) return;
    await updateVault(editingVault.id, data);
    setEditingVault(null);
  };

  const handleDelete = async () => {
    if (!deletingVault) return;
    try {
      await deleteVault(deletingVault.id);
      if (expandedVaultId === deletingVault.id) {
        setExpandedVaultId(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("envVault.deleteFailed"));
    } finally {
      setDeletingVault(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingVault(null);
  };

  const handleToggleExpand = (vault: EnvVault) => {
    setExpandedVaultId((prev) => (prev === vault.id ? null : vault.id));
  };

  const expandedVault = expandedVaultId
    ? vaults.find((v) => v.id === expandedVaultId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("envVault.title")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("envVault.subtitle")}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t("envVault.new")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("envVault.searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={envFilter} onValueChange={setEnvFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("envVault.allEnvironments")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("envVault.allEnvironments")}</SelectItem>
            {environments.map((env) => (
              <SelectItem key={env.value} value={env.value}>
                {env.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showFavorites ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Star className={`mr-1 size-4 ${showFavorites ? "fill-current" : ""}`} />
          {t("envVault.favorites")}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <VaultCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <KeyRound className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {hasFilters ? t("envVault.noMatch") : t("envVault.empty")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? t("envVault.noMatchDesc")
              : t("envVault.emptyDesc")}
          </p>
          {!hasFilters && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              {t("envVault.new")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((vault) => (
            <div key={vault.id}>
              <VaultCard
                vault={vault}
                isExpanded={expandedVaultId === vault.id}
                onToggleExpand={handleToggleExpand}
                onEdit={handleEdit}
                onDelete={setDeletingVault}
                onToggleFavorite={toggleFavorite}
              />
              {expandedVaultId === vault.id && expandedVault && (
                <div className="mt-2">
                  <VaultDetail
                    vault={expandedVault}
                    onAddVariable={addVariable}
                    onUpdateVariable={updateVariable}
                    onDeleteVariable={deleteVariable}
                    onImportVariables={importVariables}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <VaultForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        vault={editingVault}
        onSubmit={editingVault ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingVault}
        onOpenChange={(open) => !open && setDeletingVault(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("envVault.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("envVault.deleteDescPrefix")} &quot;{deletingVault?.name}&quot; {t("envVault.deleteDescSuffix")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
