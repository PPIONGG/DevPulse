"use client";

import { useRef, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChallengeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function ChallengeEditor({
  value,
  onChange,
  onSubmit,
  submitting,
}: ChallengeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!submitting) onSubmit();
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
    [value, onChange, onSubmit, submitting]
  );

  return (
    <div className="flex flex-col rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">SQL Editor</span>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={submitting || !value.trim()}
          className="h-7 gap-1.5 text-xs"
        >
          {submitting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Play className="size-3" />
          )}
          {submitting ? "Running..." : "Submit"}
          {!submitting && (
            <kbd className="ml-1 rounded bg-primary-foreground/20 px-1 py-0.5 text-[10px]">
              {navigator.userAgent.includes("Mac") ? "\u2318" : "Ctrl"}+\u21B5
            </kbd>
          )}
        </Button>
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
