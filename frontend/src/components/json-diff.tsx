"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DiffEntry {
  path: string;
  type: "added" | "removed" | "changed";
  oldValue?: unknown;
  newValue?: unknown;
}

function deepDiff(a: unknown, b: unknown, path: string): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  if (a === b) return diffs;

  if (typeof a !== typeof b || a === null || b === null) {
    diffs.push({ path: path || "(root)", type: "changed", oldValue: a, newValue: b });
    return diffs;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= a.length) {
        diffs.push({ path: childPath, type: "added", newValue: b[i] });
      } else if (i >= b.length) {
        diffs.push({ path: childPath, type: "removed", oldValue: a[i] });
      } else {
        diffs.push(...deepDiff(a[i], b[i], childPath));
      }
    }
    return diffs;
  }

  if (typeof a === "object" && typeof b === "object") {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key;
      if (!(key in objA)) {
        diffs.push({ path: childPath, type: "added", newValue: objB[key] });
      } else if (!(key in objB)) {
        diffs.push({ path: childPath, type: "removed", oldValue: objA[key] });
      } else {
        diffs.push(...deepDiff(objA[key], objB[key], childPath));
      }
    }
    return diffs;
  }

  diffs.push({ path: path || "(root)", type: "changed", oldValue: a, newValue: b });
  return diffs;
}

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  return JSON.stringify(value, null, 2);
}

export function JsonDiff() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortedKeys, setSortedKeys] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);

  const handleCompare = () => {
    if (!original.trim() || !modified.trim()) {
      setError("Both inputs are required");
      setDiffs([]);
      setHasCompared(false);
      return;
    }

    try {
      setError(null);
      let a = JSON.parse(original);
      let b = JSON.parse(modified);

      if (sortedKeys) {
        a = sortKeys(a);
        b = sortKeys(b);
      }

      const result = deepDiff(a, b, "");
      setDiffs(result);
      setHasCompared(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON input");
      setDiffs([]);
      setHasCompared(false);
    }
  };

  const added = diffs.filter((d) => d.type === "added").length;
  const removed = diffs.filter((d) => d.type === "removed").length;
  const changed = diffs.filter((d) => d.type === "changed").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Original</label>
          <Textarea
            placeholder="Paste original JSON here..."
            className="min-h-[250px] font-mono text-sm"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Modified</label>
          <Textarea
            placeholder="Paste modified JSON here..."
            className="min-h-[250px] font-mono text-sm"
            value={modified}
            onChange={(e) => setModified(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button size="sm" onClick={handleCompare}>
          Compare
        </Button>
        <div className="flex items-center gap-2">
          <Checkbox
            id="sort-keys"
            checked={sortedKeys}
            onCheckedChange={(checked) => setSortedKeys(checked === true)}
          />
          <Label htmlFor="sort-keys" className="font-normal">
            Sort keys (structural comparison)
          </Label>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {hasCompared && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400">{added} added</span>
            <span className="text-red-600 dark:text-red-400">{removed} removed</span>
            <span className="text-yellow-600 dark:text-yellow-400">{changed} changed</span>
          </div>

          {diffs.length === 0 ? (
            <div className="rounded-md border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              No differences found
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              {diffs.map((diff, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-b px-4 py-2 font-mono text-sm last:border-b-0",
                    diff.type === "added" && "bg-green-50 dark:bg-green-950/30",
                    diff.type === "removed" && "bg-red-50 dark:bg-red-950/30",
                    diff.type === "changed" && "bg-yellow-50 dark:bg-yellow-950/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                        diff.type === "added" && "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200",
                        diff.type === "removed" && "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200",
                        diff.type === "changed" && "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
                      )}
                    >
                      {diff.type === "added" ? "+" : diff.type === "removed" ? "-" : "~"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold">{diff.path}</span>
                      {diff.type === "changed" && (
                        <div className="mt-1 space-y-0.5">
                          <div className="text-red-600 dark:text-red-400">
                            - {formatValue(diff.oldValue)}
                          </div>
                          <div className="text-green-600 dark:text-green-400">
                            + {formatValue(diff.newValue)}
                          </div>
                        </div>
                      )}
                      {diff.type === "added" && (
                        <div className="mt-1 text-green-600 dark:text-green-400">
                          {formatValue(diff.newValue)}
                        </div>
                      )}
                      {diff.type === "removed" && (
                        <div className="mt-1 text-red-600 dark:text-red-400">
                          {formatValue(diff.oldValue)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
