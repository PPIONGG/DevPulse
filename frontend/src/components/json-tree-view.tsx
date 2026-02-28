"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/language-provider";

interface TreeNode {
  key: string;
  value: unknown;
  type: "string" | "number" | "boolean" | "null" | "array" | "object";
  children?: TreeNode[];
  childCount?: number;
}

function buildTree(data: unknown, key: string = "root"): TreeNode {
  if (data === null) return { key, value: null, type: "null" };
  if (Array.isArray(data)) {
    return {
      key,
      value: data,
      type: "array",
      childCount: data.length,
      children: data.map((item, i) => buildTree(item, String(i))),
    };
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    return {
      key,
      value: data,
      type: "object",
      childCount: entries.length,
      children: entries.map(([k, v]) => buildTree(v, k)),
    };
  }
  return {
    key,
    value: data,
    type: typeof data as "string" | "number" | "boolean",
  };
}

const typeColors: Record<string, string> = {
  string: "text-green-600 dark:text-green-400",
  number: "text-blue-600 dark:text-blue-400",
  boolean: "text-purple-600 dark:text-purple-400",
  null: "text-gray-500 dark:text-gray-400",
  array: "text-muted-foreground",
  object: "text-muted-foreground",
};

function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isExpandable = node.type === "array" || node.type === "object";

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-1 rounded px-1 py-0.5 hover:bg-muted/50",
          isExpandable && "cursor-pointer"
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        {isExpandable ? (
          <span className="mt-0.5 shrink-0">
            {expanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
          </span>
        ) : (
          <span className="mt-0.5 w-3.5 shrink-0" />
        )}

        <span className="font-medium text-foreground">{node.key}</span>
        <span className="text-muted-foreground">:</span>

        {node.type === "object" && (
          <span className="text-muted-foreground">
            {"{"}
            {node.childCount}
            {"}"}
          </span>
        )}
        {node.type === "array" && (
          <span className="text-muted-foreground">
            [{node.childCount}]
          </span>
        )}
        {node.type === "string" && (
          <span className={typeColors.string}>
            &quot;{String(node.value)}&quot;
          </span>
        )}
        {node.type === "number" && (
          <span className={typeColors.number}>{String(node.value)}</span>
        )}
        {node.type === "boolean" && (
          <span className={typeColors.boolean}>{String(node.value)}</span>
        )}
        {node.type === "null" && (
          <span className={typeColors.null}>null</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((child, i) => (
            <TreeNodeItem key={`${child.key}-${i}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface JsonTreeViewProps {
  input: string;
  onInputChange: (value: string) => void;
}

export function JsonTreeView({ input, onInputChange }: JsonTreeViewProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [hasParsed, setHasParsed] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);

  // Reset parsed state when input changes
  useEffect(() => {
    if (!input.trim()) {
      setTreeData(null);
      setError(null);
      setHasParsed(false);
    }
  }, [input]);

  const handleParse = () => {
    if (!input.trim()) {
      setTreeData(null);
      setError(null);
      setHasParsed(false);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setTreeData(buildTree(parsed));
      setError(null);
      setHasParsed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("jsonTools.invalidJson"));
      setTreeData(null);
      setHasParsed(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("jsonTools.input")}</label>
        <Textarea
          placeholder={t("jsonTools.inputPlaceholder")}
          className="min-h-[200px] font-mono text-sm"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
        />
      </div>

      <Button size="sm" onClick={handleParse}>
        {t("jsonTools.parseTree")}
      </Button>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {hasParsed && treeData && (
        <div className="overflow-auto rounded-md border bg-muted/20 p-3 font-mono text-sm">
          <TreeNodeItem node={treeData} depth={0} />
        </div>
      )}

      {hasParsed && !treeData && !error && (
        <div className="rounded-md border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          {t("jsonTools.emptyResult")}
        </div>
      )}
    </div>
  );
}
