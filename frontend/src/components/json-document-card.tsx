"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { JsonDocument } from "@/lib/types/database";
import { useTranslation } from "@/providers/language-provider";

interface JsonDocumentCardProps {
  document: JsonDocument;
  onEdit: (doc: JsonDocument) => void;
  onDelete: (doc: JsonDocument) => void;
  onToggleFavorite: (doc: JsonDocument) => void;
  onLoad: (doc: JsonDocument) => void;
}

export function JsonDocumentCard({
  document,
  onEdit,
  onDelete,
  onToggleFavorite,
  onLoad,
}: JsonDocumentCardProps) {
  const { t } = useTranslation();
  const previewLines = document.content
    .split("\n")
    .slice(0, 3)
    .join("\n");

  return (
    <Card
      className="cursor-pointer gap-0 py-0 transition-colors hover:bg-muted/50"
      onClick={() => onLoad(document)}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {document.is_favorite && (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          <CardTitle className="truncate text-base">{document.title}</CardTitle>
          <Badge
            variant="secondary"
            className="shrink-0 text-xs uppercase"
          >
            {document.format}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
                  onToggleFavorite(document);
                }}
              >
                <Star className="mr-2 size-4" />
                {document.is_favorite ? t("common.unfavorite") : t("common.favorite")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(document);
                }}
              >
                <Pencil className="mr-2 size-4" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(document);
                }}
              >
                <Trash2 className="mr-2 size-4" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {document.description && (
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {document.description}
          </p>
        </div>
      )}

      {document.content && (
        <CardContent className="p-0">
          <div className="bg-muted/50 px-4 py-3">
            <pre className="overflow-hidden text-xs font-mono text-muted-foreground line-clamp-3">
              {previewLines}
            </pre>
          </div>
        </CardContent>
      )}

      {document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 py-3">
          {document.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
