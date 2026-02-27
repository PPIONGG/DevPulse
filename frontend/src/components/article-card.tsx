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
import type { Article } from "@/lib/types/database";

interface ArticleCardProps {
  article: Article;
  onEdit?: (article: Article) => void;
  onDelete?: (article: Article) => void;
  onToggleFavorite?: (article: Article) => void;
}

export function ArticleCard({
  article,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ArticleCardProps) {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {article.is_favorite && (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          <CardTitle className="truncate text-base">{article.title}</CardTitle>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleFavorite?.(article)}>
                <Star className="mr-2 size-4" />
                {article.is_favorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(article)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(article)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {article.content && (
        <CardContent className="px-4 pb-3 pt-0">
          <pre className="overflow-hidden whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground line-clamp-5">{article.content}</pre>
        </CardContent>
      )}

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 py-3">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
