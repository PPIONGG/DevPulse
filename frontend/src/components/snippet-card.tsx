"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  Globe,
  CopyPlus,
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
import { CodeBlock } from "@/components/code-block";
import type { CodeSnippet } from "@/lib/types/database";

interface SnippetCardProps {
  snippet: CodeSnippet;
  readOnly?: boolean;
  onEdit?: (snippet: CodeSnippet) => void;
  onDelete?: (snippet: CodeSnippet) => void;
  onToggleFavorite?: (snippet: CodeSnippet) => void;
  onCopy?: (snippet: CodeSnippet) => void;
}

export function SnippetCard({
  snippet,
  readOnly,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
}: SnippetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {snippet.is_favorite && (
              <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
            <CardTitle className="truncate text-base">{snippet.title}</CardTitle>
            {!readOnly && snippet.copied_from && (
              <Badge variant="outline" className="shrink-0 gap-1 text-xs text-muted-foreground">
                <CopyPlus className="size-3" />
                Copied
              </Badge>
            )}
          </div>
          {readOnly && snippet.owner_name && (
            <p className="truncate text-xs text-muted-foreground">
              by {snippet.owner_name}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {snippet.language}
          </Badge>
          {snippet.is_public && (
            <Globe className="size-3.5 text-muted-foreground" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
          {readOnly && onCopy && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onCopy(snippet)}
              title="Copy to My Snippets"
            >
              <CopyPlus className="size-4" />
            </Button>
          )}
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleFavorite?.(snippet)}>
                  <Star className="mr-2 size-4" />
                  {snippet.is_favorite ? "Unfavorite" : "Favorite"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(snippet)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(snippet)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {snippet.description && (
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {snippet.description}
          </p>
        </div>
      )}

      <CardContent className="p-0">
        <CodeBlock code={snippet.code} language={snippet.language} maxLines={12} />
      </CardContent>

      {snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 py-3">
          {snippet.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
