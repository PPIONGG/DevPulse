"use client";

import { useState, useEffect } from "react";
import { Table, Database, Eye, Loader2, Key, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/providers/language-provider";
import type { ChallengeMetadata, QueryResult } from "@/lib/types/database";

interface VisualSchemaProps {
  metadata?: ChallengeMetadata;
  onPreview: (tableName: string) => Promise<QueryResult>;
}

export function VisualSchema({ metadata, onPreview }: VisualSchemaProps) {
  const { t } = useTranslation();
  const [activeTable, setActiveTable] = useState<string | null>(
    metadata?.tables[0]?.name || null
  );
  const [previewData, setPreviewData] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (metadata?.tables.length && !activeTable) {
      setActiveTable(metadata.tables[0].name);
    }
  }, [metadata, activeTable]);

  const handlePreview = async (tableName: string) => {
    setActiveTable(tableName);
    try {
      setLoading(true);
      const data = await onPreview(tableName);
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!metadata || metadata.tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Database className="mb-2 size-8 opacity-20" />
        <p className="text-sm">{t("sqlPractice.noSchemaInfo")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {metadata.tables.map((table) => (
          <Button
            key={table.name}
            variant={activeTable === table.name ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreview(table.name)}
            className="h-8 gap-1.5"
          >
            <Table className="size-3.5" />
            {table.name}
          </Button>
        ))}
      </div>

      {activeTable && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="md:col-span-2">
            <CardContent className="p-0">
              <div className="border-b bg-muted/50 px-3 py-2 text-xs font-semibold">
                {t("sqlPractice.columns")}
              </div>
              <div className="divide-y">
                {metadata.tables
                  .find((tbl) => tbl.name === activeTable)
                  ?.columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{col.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {col.type}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2 text-xs font-semibold">
                <span>{t("sqlPractice.dataPreview")}</span>
                {loading && <Loader2 className="size-3 animate-spin" />}
              </div>
              <div className="max-h-[300px] overflow-auto">
                {loading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : previewData ? (
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="sticky top-0 border-b bg-background">
                        {previewData.columns.map((col) => (
                          <th
                            key={col}
                            className="whitespace-nowrap px-2 py-1.5 text-left font-mono font-semibold"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="max-w-[150px] truncate px-2 py-1 text-mono"
                            >
                              {cell === null ? (
                                <span className="text-muted-foreground/50 italic">
                                  NULL
                                </span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {previewData.rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={previewData.columns.length}
                            className="py-8 text-center text-muted-foreground"
                          >
                            {t("sqlPractice.noDataAvailable")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Eye className="mb-2 size-8 opacity-20" />
                    <p className="text-xs">{t("sqlPractice.selectTable")}</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handlePreview(activeTable)}
                      className="mt-1 h-auto p-0 text-xs"
                    >
                      {t("sqlPractice.fetchPreview")}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
