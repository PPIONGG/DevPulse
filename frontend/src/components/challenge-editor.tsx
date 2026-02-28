"use client";

import { useRef, useCallback, useEffect } from "react";
import { Play, Send, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChallengeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset?: () => void;
  running: boolean;
  submitting: boolean;
}

export function ChallengeEditor({
  value,
  onChange,
  onRun,
  onSubmit,
  onReset,
  running,
  submitting,
}: ChallengeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = running || submitting;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        if (!busy) onSubmit();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!busy) onRun();
        return;
      }
      // Tab indentation
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange, onRun, onSubmit, busy]
  );

  const isMac = typeof navigator !== "undefined" && navigator.userAgent.includes("Mac");
  const modKey = isMac ? "\u2318" : "Ctrl";

  return (
    <div className="flex flex-col rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">SQL Editor</span>
        <div className="flex items-center gap-1.5">
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
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write your SQL query here..."
        className="min-h-[200px] w-full resize-y bg-transparent p-3 font-mono text-sm outline-none placeholder:text-muted-foreground/50"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
}
