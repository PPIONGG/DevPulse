"use client";

import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n";
import type { SqlSubmitResult, QueryResult } from "@/lib/types/database";

interface ChallengeResultProps {
  result: SqlSubmitResult;
  isPreview?: boolean;
}

export function ChallengeResult({ result, isPreview }: ChallengeResultProps) {
  const { t } = useTranslation();
  const diffMap = result.status === "wrong" && result.user_result && result.expected_result
    ? computeDiffMap(result.user_result, result.expected_result)
    : null;

  return (
    <div className="space-y-3">
      <ResultBanner
        status={result.status}
        errorMessage={result.error_message}
        executionTimeMs={result.execution_time_ms}
        isPreview={isPreview}
        result={result}
        t={t}
      />
      {result.user_result && (
        <ResultTable
          title={t("sqlPractice.yourOutput")}
          data={result.user_result}
          diffCells={diffMap?.user}
          isUserOutput
          noRowsLabel={t("sqlPractice.noRows")}
        />
      )}
      {result.status === "wrong" && result.expected_result && (
        <ResultTable
          title={t("sqlPractice.expectedOutput")}
          data={result.expected_result}
          diffCells={diffMap?.expected}
          noRowsLabel={t("sqlPractice.noRows")}
        />
      )}
    </div>
  );
}

function getWrongReason(user: QueryResult, expected: QueryResult, t: (key: TranslationKey) => string): string {
  if (user.columns.length !== expected.columns.length) {
    return t("sqlPractice.columnCountMismatch")
      .replace("{expected}", String(expected.columns.length))
      .replace("{actual}", String(user.columns.length));
  }

  const userCols = user.columns.map(c => c.toLowerCase()).sort();
  const expCols = expected.columns.map(c => c.toLowerCase()).sort();
  if (userCols.join(",") !== expCols.join(",")) {
    return t("sqlPractice.columnNamesMismatch");
  }

  if (user.rows.length !== expected.rows.length) {
    return t("sqlPractice.rowCountMismatch")
      .replace("{expected}", String(expected.rows.length))
      .replace("{actual}", String(user.rows.length));
  }

  return t("sqlPractice.dataMismatch");
}

function ResultBanner({
  status,
  errorMessage,
  executionTimeMs,
  isPreview,
  result,
  t,
}: {
  status: string;
  errorMessage: string;
  executionTimeMs: number;
  isPreview?: boolean;
  result: SqlSubmitResult;
  t: (key: TranslationKey) => string;
}) {
  if (status === "correct") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {t("sqlPractice.correct")}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {t("sqlPractice.executedIn")} {executionTimeMs}ms
            {isPreview && ` — ${t("sqlPractice.previewNote")}`}
          </p>
        </div>
        {isPreview && (
          <span className="shrink-0 rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            {t("sqlPractice.preview")}
          </span>
        )}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900 dark:bg-orange-950">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-600 dark:text-orange-400" />
        <div>
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            {t("sqlPractice.error")}
          </p>
          <p className="mt-1 text-xs font-mono text-orange-700 dark:text-orange-300 break-all">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  const wrongReason = result.user_result && result.expected_result
    ? getWrongReason(result.user_result, result.expected_result, t)
    : "";

  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
      <XCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {t("sqlPractice.wrongAnswer")}
        </p>
        <p className="mt-0.5 text-xs font-medium text-red-700 dark:text-red-300">
          {wrongReason}
        </p>
        <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">
          {t("sqlPractice.executedIn")} {executionTimeMs}ms &mdash; {t("sqlPractice.compareOutputs")}
        </p>
      </div>
      {isPreview && (
        <span className="shrink-0 rounded-full bg-red-200 px-2 py-0.5 text-[10px] font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          {t("sqlPractice.preview")}
        </span>
      )}
    </div>
  );
}

type DiffCellSet = Set<string>;

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function computeDiffMap(
  user: QueryResult,
  expected: QueryResult
): { user: DiffCellSet; expected: DiffCellSet } {
  const userDiff: DiffCellSet = new Set();
  const expectedDiff: DiffCellSet = new Set();

  const maxRows = Math.max(user.rows.length, expected.rows.length);
  const maxCols = Math.max(user.columns.length, expected.columns.length);

  for (let r = 0; r < maxRows; r++) {
    const uRow = user.rows[r];
    const eRow = expected.rows[r];
    for (let c = 0; c < maxCols; c++) {
      if (!uRow) {
        expectedDiff.add(cellKey(r, c));
        continue;
      }
      if (!eRow) {
        userDiff.add(cellKey(r, c));
        continue;
      }
      const uVal = c < uRow.length ? String(uRow[c] ?? "NULL") : undefined;
      const eVal = c < eRow.length ? String(eRow[c] ?? "NULL") : undefined;
      if (uVal !== eVal) {
        if (uVal !== undefined) userDiff.add(cellKey(r, c));
        if (eVal !== undefined) expectedDiff.add(cellKey(r, c));
      }
    }
  }

  return { user: userDiff, expected: expectedDiff };
}

function ResultTable({
  title,
  data,
  diffCells,
  isUserOutput,
  noRowsLabel,
}: {
  title: string;
  data: QueryResult;
  diffCells?: DiffCellSet;
  isUserOutput?: boolean;
  noRowsLabel?: string;
}) {
  const { t } = useTranslation();
  const isUserDiff = isUserOutput ?? false;

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="px-4 py-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title} ({data.row_count} {data.row_count !== 1 ? t("sqlPractice.rows") : t("sqlPractice.row")})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="sticky top-0 border-t bg-muted/80 backdrop-blur-sm">
                <th className="w-8 whitespace-nowrap px-2 py-1.5 text-center font-mono font-semibold text-muted-foreground">
                  #
                </th>
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
                <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="w-8 whitespace-nowrap px-2 py-1.5 text-center font-mono text-muted-foreground/60">
                    {i + 1}
                  </td>
                  {row.map((cell, j) => {
                    const isDiff = diffCells?.has(cellKey(i, j));
                    const diffBg = isDiff
                      ? isUserDiff
                        ? "bg-red-100 dark:bg-red-950/50"
                        : "bg-green-100 dark:bg-green-950/50"
                      : "";
                    const isBool = cell === true || cell === false;

                    return (
                      <td
                        key={j}
                        className={`max-w-[300px] truncate whitespace-nowrap px-3 py-1.5 font-mono ${diffBg}`}
                        title={cell === null ? "NULL" : String(cell)}
                      >
                        {cell === null ? (
                          <span className="text-muted-foreground/50 italic">NULL</span>
                        ) : isBool ? (
                          <span className={cell ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                            {String(cell)}
                          </span>
                        ) : (
                          String(cell)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={data.columns.length + 1}
                    className="px-3 py-4 text-center text-muted-foreground"
                  >
                    {noRowsLabel || "No rows returned"}
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
