"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/providers/language-provider";

interface VaultImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (raw: string) => Promise<void>;
}

function parsePreview(raw: string): { key: string; value: string }[] {
  const result: { key: string; value: string }[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) {
      result.push({ key, value });
    }
  }
  return result;
}

export function VaultImportDialog({
  open,
  onOpenChange,
  onImport,
}: VaultImportDialogProps) {
  const { t } = useTranslation();
  const [raw, setRaw] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => parsePreview(raw), [raw]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      setRaw("");
      setError(null);
    }
    onOpenChange(value);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      await onImport(raw);
      onOpenChange(false);
      setRaw("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("envVault.importFailed"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("envVault.importTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="env-raw">
              {t("envVault.importLabel")}
            </Label>
            <Textarea
              id="env-raw"
              placeholder={`# Example\nDATABASE_URL=postgres://...\nAPI_KEY="my-secret-key"`}
              className="min-h-[120px] font-mono text-sm"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>{t("envVault.importPreview")}</Label>
                <Badge variant="secondary" className="text-xs">
                  {preview.length} {preview.length !== 1 ? t("envVault.variables") : t("envVault.variable")}
                </Badge>
              </div>
              <div className="max-h-[200px] overflow-y-auto rounded-md border bg-muted/30 p-3">
                {preview.map((p, i) => (
                  <div key={i} className="flex gap-1 font-mono text-xs">
                    <span className="font-medium text-foreground">{p.key}</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="truncate text-muted-foreground">
                      {p.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || preview.length === 0}
          >
            {importing ? t("envVault.importing") : `${t("common.import")} ${preview.length} Variable${preview.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
