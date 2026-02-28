"use client";

import { useCallback } from "react";
import { Play, Send, Loader2, RotateCcw, Info, Layout } from "lucide-react";
import { format } from "sql-formatter";
import { useTheme } from "next-themes";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { EditorView, keymap } from "@codemirror/view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChallengeMetadata } from "@/lib/types/database";

interface ChallengeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset?: () => void;
  running: boolean;
  submitting: boolean;
  metadata?: ChallengeMetadata;
}

export function ChallengeEditor({
  value,
  onChange,
  onRun,
  onSubmit,
  onReset,
  running,
  submitting,
  metadata,
}: ChallengeEditorProps) {
  const { resolvedTheme } = useTheme();
  const busy = running || submitting;

  const isMac = typeof navigator !== "undefined" && navigator.userAgent.includes("Mac");
  const modKey = isMac ? "\u2318" : "Ctrl";

  const handleFormat = useCallback(() => {
    try {
      const formatted = format(value, {
        language: "postgresql",
        uppercase: true,
      });
      onChange(formatted);
    } catch (err) {
      console.error("Format error:", err);
    }
  }, [value, onChange]);

  // Transform metadata into CodeMirror schema format
  const getSchema = () => {
    if (!metadata) return undefined;
    const schema: Record<string, string[]> = {};
    metadata.tables.forEach((table) => {
      schema[table.name] = table.columns.map((c) => c.name);
    });
    return schema;
  };

  // Custom keymaps for Run (Mod-Enter) and Submit (Mod-Shift-Enter)
  const customKeymap = keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        if (!busy) onRun();
        return true;
      },
    },
    {
      key: "Mod-Shift-Enter",
      run: () => {
        if (!busy) onSubmit();
        return true;
      },
    },
  ]);

  return (
    <div className="flex flex-col rounded-lg border bg-background overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">SQL Editor</span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            disabled={busy || !value.trim()}
            className="h-7 gap-1 text-xs text-muted-foreground"
          >
            <Layout className="size-3" />
            Format
          </Button>
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={busy || !value.trim()}
              className="h-7 gap-1 text-xs text-muted-foreground"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRun}
            disabled={busy || !value.trim()}
            className="h-7 gap-1.5 text-xs"
          >
            {running ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="size-3" />
            )}
            {running ? "Running..." : "Run"}
            {!busy && (
              <kbd className="ml-0.5 rounded bg-muted px-1 py-0.5 text-[10px]">
                {modKey}+↵
              </kbd>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={busy || !value.trim()}
            className="h-7 gap-1.5 text-xs"
          >
            {submitting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
            {submitting ? "Submitting..." : "Submit"}
            {!busy && (
              <kbd className="ml-0.5 rounded bg-primary-foreground/20 px-1 py-0.5 text-[10px]">
                {modKey}+⇧+↵
              </kbd>
            )}
          </Button>
        </div>
      </div>
      
      <div className="relative min-h-[200px] w-full text-sm">
        <CodeMirror
          value={value}
          onChange={(val) => onChange(val)}
          theme={resolvedTheme === "dark" ? vscodeDark : vscodeLight}
          extensions={[
            sql({
              dialect: PostgreSQL,
              schema: getSchema(),
            }),
            customKeymap,
            EditorView.lineWrapping,
          ]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            autocompletion: true,
          }}
          className="h-full min-h-[200px] [&>.cm-editor]:min-h-[200px] [&>.cm-editor]:outline-none"
        />
      </div>

      {metadata && metadata.tables.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t bg-muted/30 px-3 py-2">
          <Info className="mr-1 size-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground mr-1">Available:</span>
          {metadata.tables.map((table) => (
            <Badge
              key={table.name}
              variant="outline"
              className="text-[10px] font-mono px-1.5 py-0 h-4 border-dashed bg-background/50"
            >
              {table.name}
            </Badge>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground italic">
            Press Ctrl+Space for autocomplete
          </span>
        </div>
      )}
    </div>
  );
}
