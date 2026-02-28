"use client";

import { useEffect } from "react";
import { Trash2, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/code-block";
import {
  getStatusColor,
  getStatusBg,
  formatBytes,
  formatDuration,
  getMethodStyle,
} from "@/config/api-playground";
import { useTranslation } from "@/providers/language-provider";
import { cn } from "@/lib/utils";
import type { ApiProxyResponse, ApiRequestHistory } from "@/lib/types/database";

interface ApiResponseViewerProps {
  response: ApiProxyResponse | null;
  sending: boolean;
  history: ApiRequestHistory[];
  historyLoading: boolean;
  onFetchHistory: () => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

export function ApiResponseViewer({
  response,
  sending,
  history,
  historyLoading,
  onFetchHistory,
  onDeleteHistory,
  onClearHistory,
}: ApiResponseViewerProps) {
  const { t } = useTranslation();
  useEffect(() => {
    onFetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectLanguage = (body: string, headers: Record<string, string>): string => {
    const contentType = Object.entries(headers).find(
      ([k]) => k.toLowerCase() === "content-type"
    )?.[1] ?? "";
    if (contentType.includes("json")) return "json";
    if (contentType.includes("xml") || contentType.includes("html")) return "html";
    if (contentType.includes("css")) return "css";
    if (contentType.includes("javascript")) return "javascript";
    // Try to detect from body
    const trimmed = body.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
    if (trimmed.startsWith("<")) return "html";
    return "plaintext";
  };

  const formatBody = (body: string, lang: string): string => {
    if (lang === "json") {
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    }
    return body;
  };

  if (sending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">{t("apiPlayground.sending")}</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <Tabs defaultValue="history" className="flex flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="response">{t("apiPlayground.tabResponse")}</TabsTrigger>
          <TabsTrigger value="history">{t("apiPlayground.tabHistory")}</TabsTrigger>
        </TabsList>
        <TabsContent value="response" className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {t("apiPlayground.sendToSeeResponse")}
          </p>
        </TabsContent>
        <TabsContent value="history" className="mt-3 flex-1 overflow-y-auto">
          <HistoryList
            history={history}
            loading={historyLoading}
            onDelete={onDeleteHistory}
            onClear={onClearHistory}
          />
        </TabsContent>
      </Tabs>
    );
  }

  const lang = detectLanguage(response.body, response.headers);
  const formattedBody = formatBody(response.body, lang);
  const headerEntries = Object.entries(response.headers);

  return (
    <div className="flex flex-1 flex-col">
      {/* Status bar */}
      <div className="flex items-center gap-3 pb-3">
        <Badge
          variant="secondary"
          className={cn("font-mono text-sm font-bold", getStatusColor(response.status), getStatusBg(response.status))}
        >
          {response.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDuration(response.time_ms)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatBytes(response.size)}
        </span>
      </div>

      <Tabs defaultValue="body" className="flex flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="body">{t("apiPlayground.tabBody")}</TabsTrigger>
          <TabsTrigger value="headers">
            {t("apiPlayground.tabHeaders")} ({headerEntries.length})
          </TabsTrigger>
          <TabsTrigger value="history">{t("apiPlayground.tabHistory")}</TabsTrigger>
        </TabsList>
        <TabsContent value="body" className="mt-3 flex-1 overflow-auto">
          {response.body ? (
            <CodeBlock code={formattedBody} language={lang} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("apiPlayground.emptyResponseBody")}</p>
          )}
        </TabsContent>
        <TabsContent value="headers" className="mt-3">
          <div className="space-y-1">
            {headerEntries.map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="shrink-0 font-medium">{key}:</span>
                <span className="break-all text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-3 flex-1 overflow-y-auto">
          <HistoryList
            history={history}
            loading={historyLoading}
            onDelete={onDeleteHistory}
            onClear={onClearHistory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HistoryList({
  history,
  loading,
  onDelete,
  onClear,
}: {
  history: ApiRequestHistory[];
  loading: boolean;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="mb-2 size-8 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">{t("apiPlayground.noHistoryYet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {history.length !== 1
            ? t("apiPlayground.requestsCount").replace("{count}", String(history.length))
            : t("apiPlayground.requestCount").replace("{count}", String(history.length))}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-destructive hover:text-destructive"
          onClick={onClear}
        >
          {t("apiPlayground.clearAll")}
        </Button>
      </div>
      {history.map((item) => {
        const methodStyle = getMethodStyle(item.method);
        return (
          <div
            key={item.id}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <span className={cn("shrink-0 font-mono text-[10px] font-bold", methodStyle.color)}>
              {item.method.slice(0, 3)}
            </span>
            <Badge
              variant="secondary"
              className={cn(
                "h-4 shrink-0 px-1 text-[10px] font-mono",
                getStatusColor(item.response_status),
                getStatusBg(item.response_status)
              )}
            >
              {item.response_status}
            </Badge>
            <span className="flex-1 truncate font-mono text-[11px]">
              {item.url}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatDuration(item.response_time_ms)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
