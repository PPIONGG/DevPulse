"use client";

import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SqlSubmitResult, QueryResult } from "@/lib/types/database";

interface ChallengeResultProps {
  result: SqlSubmitResult;
}

export function ChallengeResult({ result }: ChallengeResultProps) {
  return (
    <div className="space-y-3">
      <ResultBanner status={result.status} errorMessage={result.error_message} executionTimeMs={result.execution_time_ms} />
      {result.user_result && (
        <ResultTable title="Your Output" data={result.user_result} />
      )}
      {result.status === "wrong" && result.expected_result && (
        <ResultTable title="Expected Output" data={result.expected_result} />
      )}
    </div>
  );
}

function ResultBanner({
  status,
  errorMessage,
  executionTimeMs,
}: {
  status: string;
  errorMessage: string;
  executionTimeMs: number;
}) {
  if (status === "correct") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Correct!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Executed in {executionTimeMs}ms
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900 dark:bg-orange-950">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-600 dark:text-orange-400" />
        <div>
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Error
          </p>
          <p className="mt-1 text-xs font-mono text-orange-700 dark:text-orange-300 break-all">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
      <XCircle className="size-5 shrink-0 text-red-600 dark:text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          Wrong Answer
        </p>
        <p className="text-xs text-red-600 dark:text-red-400">
          Executed in {executionTimeMs}ms &mdash; Compare your output with the expected output below.
        </p>
      </div>
    </div>
  );
}

function ResultTable({ title, data }: { title: string; data: QueryResult }) {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="px-4 py-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title} ({data.row_count} row{data.row_count !== 1 ? "s" : ""})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-t bg-muted/50">
                {data.columns.map((col, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap px-3 py-1.5 text-left font-mono font-semibold"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="whitespace-nowrap px-3 py-1.5 font-mono"
                    >
                      {cell === null ? (
                        <span className="text-muted-foreground/50 italic">NULL</span>
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={data.columns.length}
                    className="px-3 py-4 text-center text-muted-foreground"
                  >
                    No rows returned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
