"use client";

import { useState } from "react";
import {
  Plus,
  Upload,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VariableRow } from "@/components/variable-row";
import { VaultImportDialog } from "@/components/vault-import-dialog";
import { getEnvironmentConfig } from "@/config/environments";
import { toast } from "sonner";
import type { EnvVault, EnvVariableInput } from "@/lib/types/database";

interface VaultDetailProps {
  vault: EnvVault;
  onAddVariable: (vaultId: string, input: EnvVariableInput) => Promise<void>;
  onUpdateVariable: (vaultId: string, varId: string, input: EnvVariableInput) => Promise<void>;
  onDeleteVariable: (vaultId: string, varId: string) => Promise<void>;
  onImportVariables: (vaultId: string, raw: string) => Promise<void>;
}

export function VaultDetail({
  vault,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
  onImportVariables,
}: VaultDetailProps) {
  const envConfig = getEnvironmentConfig(vault.environment);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [revealAll, setRevealAll] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleReveal = (varId: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(varId)) {
        next.delete(varId);
      } else {
        next.add(varId);
      }
      return next;
    });
  };

  const handleToggleRevealAll = () => {
    if (revealAll) {
      setRevealedIds(new Set());
      setRevealAll(false);
    } else {
      setRevealedIds(new Set(vault.variables.map((v) => v.id)));
      setRevealAll(true);
    }
  };

  const copyAll = () => {
    const text = vault.variables
      .map((v) => `${v.key}=${v.value}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exportAsEnv = () => {
    const text = vault.variables.map((v) => `${v.key}=${v.value}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${vault.name.replace(/\s+/g, "-").toLowerCase()}.env`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddVariable = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    try {
      await onAddVariable(vault.id, {
        key: newKey.trim(),
        value: newValue,
        is_secret: true,
      });
      setNewKey("");
      setNewValue("");
      setAddingNew(false);
    } catch {
      // error handled by parent hook
    } finally {
      setSaving(false);
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddVariable();
    } else if (e.key === "Escape") {
      setAddingNew(false);
      setNewKey("");
      setNewValue("");
    }
  };

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{vault.name}</CardTitle>
            <Badge
              variant="secondary"
              className="text-xs text-white"
            >
              <span className={`mr-1.5 inline-block size-2 rounded-full ${envConfig.color}`} />
              {envConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddingNew(true)}
            >
              <Plus className="mr-1 size-3.5" />
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-1 size-3.5" />
              Import
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={copyAll}
              disabled={vault.variables.length === 0}
            >
              <Copy className="mr-1 size-3.5" />
              Copy All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={exportAsEnv}
              disabled={vault.variables.length === 0}
            >
              <Download className="mr-1 size-3.5" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleToggleRevealAll}
              disabled={vault.variables.length === 0}
            >
              {revealAll ? (
                <EyeOff className="mr-1 size-3.5" />
              ) : (
                <Eye className="mr-1 size-3.5" />
              )}
              {revealAll ? "Hide All" : "Reveal All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {vault.variables.length === 0 && !addingNew ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <KeyRound className="mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No variables yet. Add one or import from a .env file.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingNew(true)}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add Variable
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImportOpen(true)}
                >
                  <Upload className="mr-1 size-3.5" />
                  Import .env
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {vault.variables.map((variable) => (
                <VariableRow
                  key={variable.id}
                  variable={variable}
                  isRevealed={revealAll || revealedIds.has(variable.id)}
                  onToggleReveal={() => toggleReveal(variable.id)}
                  onUpdate={(input) =>
                    onUpdateVariable(vault.id, variable.id, input)
                  }
                  onDelete={() =>
                    onDeleteVariable(vault.id, variable.id)
                  }
                />
              ))}
              {addingNew && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                  <Input
                    className="h-7 w-40 font-mono text-sm"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                    onKeyDown={handleAddKeyDown}
                    placeholder="KEY"
                    autoFocus
                  />
                  <span className="text-muted-foreground">=</span>
                  <Input
                    className="h-7 flex-1 font-mono text-sm"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    placeholder="value"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={handleAddVariable}
                    disabled={saving || !newKey.trim()}
                  >
                    {saving ? "..." : "Add"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      setAddingNew(false);
                      setNewKey("");
                      setNewValue("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <VaultImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(raw) => onImportVariables(vault.id, raw)}
      />
    </>
  );
}
