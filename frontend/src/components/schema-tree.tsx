"use client";

import { useState } from "react";
import {
  ChevronRight,
  Table2,
  Key,
  Link2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/providers/language-provider";
import type { TableInfo, TableDetail } from "@/lib/types/database";

interface SchemaTreeProps {
  tables: TableInfo[];
  loading: boolean;
  tableDetail: TableDetail | null;
  onSelectTable: (tableName: string) => void;
  onInsertTable: (tableName: string) => void;
  onRefresh: () => void;
}

export function SchemaTree({
  tables,
  loading,
  tableDetail,
  onSelectTable,
  onInsertTable,
  onRefresh,
}: SchemaTreeProps) {
  const { t } = useTranslation();
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const handleToggle = (tableName: string) => {
    if (expandedTable === tableName) {
      setExpandedTable(null);
    } else {
      setExpandedTable(tableName);
      onSelectTable(tableName);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        {t("dbExplorer.noTablesFound")}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {t("dbExplorer.tables")} ({tables.length})
        </span>
        <Button variant="ghost" size="icon" className="size-6" onClick={onRefresh}>
          <RefreshCw className="size-3" />
        </Button>
      </div>
      {tables.map((table) => (
        <Collapsible
          key={table.name}
          open={expandedTable === table.name}
          onOpenChange={() => handleToggle(table.name)}
        >
          <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-muted/50">
            <ChevronRight
              className={`size-3 shrink-0 transition-transform ${
                expandedTable === table.name ? "rotate-90" : ""
              }`}
            />
            <Table2 className="size-3.5 shrink-0 text-muted-foreground" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="flex-1 truncate text-left cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsertTable(table.name);
                  }}
                >
                  {table.name}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t("dbExplorer.clickToInsert")}</p>
                <p className="text-xs text-muted-foreground">
                  ~{table.row_estimate} rows, {formatSize(table.size_bytes)}
                </p>
              </TooltipContent>
            </Tooltip>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-5 border-l pl-2">
              {expandedTable === table.name && tableDetail?.table.name === table.name ? (
                <>
                  {tableDetail.columns.map((col) => {
                    const fk = tableDetail.foreign_keys.find(
                      (f) => f.column_name === col.name
                    );
                    return (
                      <div
                        key={col.name}
                        className="flex items-center gap-1.5 py-0.5 pl-2 text-xs"
                      >
                        {col.is_primary_key ? (
                          <Key className="size-3 shrink-0 text-yellow-500" />
                        ) : fk ? (
                          <Link2 className="size-3 shrink-0 text-blue-500" />
                        ) : (
                          <span className="size-3 shrink-0" />
                        )}
                        <span className="truncate">{col.name}</span>
                        <span className="ml-auto shrink-0 text-muted-foreground">
                          {col.data_type}
                        </span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
