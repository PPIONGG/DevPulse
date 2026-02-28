"use client";

import { useState } from "react";
import { Eye, EyeOff, Trash2, Check, X, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EnvVariable, EnvVariableInput } from "@/lib/types/database";

interface VariableRowProps {
  variable: EnvVariable;
  isRevealed: boolean;
  onToggleReveal: () => void;
  onUpdate: (input: EnvVariableInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function VariableRow({
  variable,
  isRevealed,
  onToggleReveal,
  onUpdate,
  onDelete,
}: VariableRowProps) {
  const [editing, setEditing] = useState(false);
  const [editKey, setEditKey] = useState(variable.key);
  const [editValue, setEditValue] = useState(variable.value);
  const [editIsSecret, setEditIsSecret] = useState(variable.is_secret);
  const [saving, setSaving] = useState(false);

  const displayValue = variable.is_secret && !isRevealed
    ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
    : variable.value;

  const startEditing = () => {
    setEditKey(variable.key);
    setEditValue(variable.value);
    setEditIsSecret(variable.is_secret);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveEditing = async () => {
    if (!editKey.trim()) return;
    setSaving(true);
    try {
      await onUpdate({ key: editKey.trim(), value: editValue, is_secret: editIsSecret });
      setEditing(false);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEditing();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <Input
          className="h-7 w-40 font-mono text-sm"
          value={editKey}
          onChange={(e) => setEditKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="KEY"
          autoFocus
        />
        <span className="text-muted-foreground">=</span>
        <Input
          className="h-7 flex-1 font-mono text-sm"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="value"
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setEditIsSecret(!editIsSecret)}
          title={editIsSecret ? "Mark as non-secret" : "Mark as secret"}
        >
          {editIsSecret ? (
            <Lock className="size-3.5" />
          ) : (
            <Unlock className="size-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-green-600"
          onClick={saveEditing}
          disabled={saving}
        >
          <Check className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={cancelEditing}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-muted/50">
      <button
        className="cursor-pointer truncate font-mono text-sm font-medium text-foreground"
        onClick={startEditing}
        title="Click to edit"
      >
        {variable.key}
      </button>
      <span className="text-muted-foreground">=</span>
      <button
        className="min-w-0 flex-1 cursor-pointer truncate text-left font-mono text-sm text-muted-foreground"
        onClick={startEditing}
        title="Click to edit"
      >
        {displayValue}
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {variable.is_secret && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onToggleReveal}
            title={isRevealed ? "Hide value" : "Reveal value"}
          >
            {isRevealed ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive"
          onClick={onDelete}
          title="Delete variable"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
