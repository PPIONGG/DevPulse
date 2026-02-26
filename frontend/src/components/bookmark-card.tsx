"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  ExternalLink,
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
import type { Bookmark } from "@/lib/types/database";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  onToggleFavorite?: (bookmark: Bookmark) => void;
}

function getFaviconUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

function getDisplayUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
  } catch {
    return url;
  }
}

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onToggleFavorite,
}: BookmarkCardProps) {
  const favicon = getFaviconUrl(bookmark.url);

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {bookmark.is_favorite && (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          {favicon && (
            <img
              src={favicon}
              alt=""
              className="size-4 shrink-0"
              loading="lazy"
            />
          )}
          <CardTitle className="truncate text-base">{bookmark.title}</CardTitle>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleFavorite?.(bookmark)}>
                <Star className="mr-2 size-4" />
                {bookmark.is_favorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(bookmark)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(bookmark)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 pt-0 space-y-2">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {getDisplayUrl(bookmark.url)}
          <ExternalLink className="size-3" />
        </a>
        {bookmark.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {bookmark.description}
          </p>
        )}
      </CardContent>

      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 py-3">
          {bookmark.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
