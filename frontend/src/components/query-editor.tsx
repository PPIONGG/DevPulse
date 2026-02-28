"use client";

import { useRef, useEffect, useCallback } from "react";
import { Play, Save, Trash2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/providers/language-provider";
import type { QueryResult } from "@/lib/types/database";

interface QueryEditorProps {
  query: string;
  onQueryChange: (query: string) => void;
  onRun: () => void;
  onSave: () => void;
  onClear: () => void;
  loading: boolean;
  result: QueryResult | null;
  isReadOnly: boolean;
}

export function QueryEditor({
  query,
  onQueryChange,
  onRun,
  onSave,
  onClear,
  loading,
  result,
  isReadOnly,
}: QueryEditorProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onRun();
      }
      // Tab inserts spaces
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        onQueryChange(newValue);
        // Restore cursor position after state update
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    },
    [onRun, onQueryChange]
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t("dbExplorer.queryEditor")}</span>
          {isReadOnly && (
            <Badge variant="secondary" className="text-xs">
              <Lock className="mr-1 size-3" />
              {t("dbExplorer.readOnlyBadge")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {result && (
            <span className="mr-2 text-xs text-muted-foreground">
              {result.row_count} {t("dbExplorer.rows")} in {result.execution_time_ms}ms
              {result.truncated && ` ${t("dbExplorer.truncated")}`}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={!query.trim()}
          >
            <Trash2 className="mr-1 size-3.5" />
            {t("dbExplorer.clear")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!query.trim()}
          >
            <Save className="mr-1 size-3.5" />
            {t("dbExplorer.save")}
          </Button>
          <Button
            size="sm"
            onClick={onRun}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <Play className="mr-1 size-3.5" />
            )}
            {t("dbExplorer.run")}
            <kbd className="ml-1.5 hidden rounded bg-primary-foreground/20 px-1 text-[10px] sm:inline-block">
              Ctrl+Enter
            </kbd>
          </Button>
        </div>
      </div>
      <Textarea
        ref={textareaRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("dbExplorer.queryPlaceholder")}
        className="flex-1 resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
        style={{ minHeight: "120px" }}
      />
    </div>
  );
}
