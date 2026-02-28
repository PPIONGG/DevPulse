"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/providers/language-provider";
import type { KanbanBoard } from "@/lib/types/database";

interface KanbanBoardCardProps {
  board: KanbanBoard;
  onClick: (board: KanbanBoard) => void;
  onEdit: (board: KanbanBoard) => void;
  onDelete: (board: KanbanBoard) => void;
  onToggleFavorite: (board: KanbanBoard) => void;
}

export function KanbanBoardCard({
  board,
  onClick,
  onEdit,
  onDelete,
  onToggleFavorite,
}: KanbanBoardCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className="cursor-pointer gap-0 py-0 transition-colors hover:border-primary/50 hover:shadow-md"
      onClick={() => onClick(board)}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {board.is_favorite && (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          <CardTitle className="truncate text-base">{board.title}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(board);
              }}
            >
              <Star className="mr-2 size-4" />
              {board.is_favorite ? t("common.unfavorite") : t("common.favorite")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(board);
              }}
            >
              <Pencil className="mr-2 size-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(board);
              }}
            >
              <Trash2 className="mr-2 size-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {board.description && (
        <CardContent className="px-4 pb-3 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {board.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
