"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  Copy,
  KeyRound,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getEnvironmentConfig } from "@/config/environments";
import { toast } from "sonner";
import type { EnvVault } from "@/lib/types/database";

interface VaultCardProps {
  vault: EnvVault;
  isExpanded: boolean;
  onToggleExpand: (vault: EnvVault) => void;
  onEdit: (vault: EnvVault) => void;
  onDelete: (vault: EnvVault) => void;
  onToggleFavorite: (vault: EnvVault) => void;
}

export function VaultCard({
  vault,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleFavorite,
}: VaultCardProps) {
  const envConfig = getEnvironmentConfig(vault.environment);

  const copyAsEnv = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = vault.variables
      .map((v) => `${v.key}=${v.value}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card
      className={`gap-0 cursor-pointer py-0 transition-colors hover:bg-muted/50 ${isExpanded ? "ring-2 ring-primary" : ""}`}
      onClick={() => onToggleExpand(vault)}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">
                {vault.name}
              </CardTitle>
              <Badge
                variant="secondary"
                className="shrink-0 text-xs text-white"
              >
                <span className={`mr-1.5 inline-block size-2 rounded-full ${envConfig.color}`} />
                {envConfig.label}
              </Badge>
              {vault.is_favorite && (
                <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <KeyRound className="size-3" />
              <span>{vault.variables.length} variable{vault.variables.length !== 1 ? "s" : ""}</span>
              {vault.description && (
                <>
                  <span className="text-border">|</span>
                  <span className="truncate">{vault.description}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(vault);
            }}
            title={vault.is_favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`size-4 ${vault.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={copyAsEnv}
            title="Copy as .env"
          >
            <Copy className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(vault);
                }}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(vault);
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  );
}
