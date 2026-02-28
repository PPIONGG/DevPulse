"use client";

import { Table2 } from "lucide-react";
import type { QueryResult } from "@/lib/types/database";

interface ResultsTableProps {
  result: QueryResult | null;
}

export function ResultsTable({ result }: ResultsTableProps) {
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Table2 className="mb-2 size-8 opacity-50" />
        <p className="text-sm">Run a query to see results</p>
      </div>
    );
  }

  if (result.columns.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <p className="text-sm">Query executed successfully</p>
        <p className="text-xs">{result.row_count} row{result.row_count !== 1 ? "s" : ""} affected in {result.execution_time_ms}ms</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Results</span>
        <span className="text-xs text-muted-foreground">
          {result.row_count} row{result.row_count !== 1 ? "s" : ""}
          {result.truncated && " (results truncated)"}
          {" - "}
          {result.execution_time_ms}ms
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr>
              <th className="w-10 border-b px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                #
              </th>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  className="border-b px-3 py-1.5 text-left text-xs font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-muted/30">
                <td className="border-b px-2 py-1 text-xs text-muted-foreground">
                  {rowIdx + 1}
                </td>
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="max-w-[300px] truncate border-b px-3 py-1 font-mono text-xs"
                    title={cell == null ? "NULL" : String(cell)}
                  >
                    {cell == null ? (
                      <span className="italic text-muted-foreground">NULL</span>
                    ) : typeof cell === "boolean" ? (
                      <span className={cell ? "text-green-600" : "text-red-500"}>
                        {String(cell)}
                      </span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
