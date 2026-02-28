"use client";

import { useState, useCallback, useMemo } from "react";
import { Send, Copy, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiKeyValueEditor } from "@/components/api-key-value-editor";
import { httpMethods, bodyTypes, getMethodStyle } from "@/config/api-playground";
import { useTranslation } from "@/providers/language-provider";
import { toast } from "sonner";
import type { ApiRequest, ApiRequestInput, KeyValuePair, EnvVault, ApiProxyRequest } from "@/lib/types/database";

interface ApiRequestEditorProps {
  request: ApiRequest;
  envVaults: EnvVault[];
  sending: boolean;
  onUpdate: (input: ApiRequestInput) => Promise<unknown>;
  onSend: (proxy: ApiProxyRequest) => void;
}

export function ApiRequestEditor({
  request,
  envVaults,
  sending,
  onUpdate,
  onSend,
}: ApiRequestEditorProps) {
  const { t } = useTranslation();
  const [method, setMethod] = useState(request.method);
  const [url, setUrl] = useState(request.url);
  const [headers, setHeaders] = useState<KeyValuePair[]>(request.headers ?? []);
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>(request.query_params ?? []);
  const [bodyType, setBodyType] = useState(request.body_type);
  const [body, setBody] = useState(request.body);
  const [envVaultId, setEnvVaultId] = useState<string>(request.env_vault_id ?? "none");
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when request changes
  const [prevId, setPrevId] = useState(request.id);
  if (request.id !== prevId) {
    setPrevId(request.id);
    setMethod(request.method);
    setUrl(request.url);
    setHeaders(request.headers ?? []);
    setQueryParams(request.query_params ?? []);
    setBodyType(request.body_type);
    setBody(request.body);
    setEnvVaultId(request.env_vault_id ?? "none");
  }

  const buildInput = useCallback((): ApiRequestInput => ({
    collection_id: request.collection_id,
    title: request.title,
    method,
    url,
    headers,
    query_params: queryParams,
    body_type: bodyType,
    body,
    env_vault_id: envVaultId === "none" ? null : envVaultId,
    sort_order: request.sort_order,
  }), [request, method, url, headers, queryParams, bodyType, body, envVaultId]);

  const debouncedSave = useCallback(
    (input: ApiRequestInput) => {
      if (saveTimer) clearTimeout(saveTimer);
      const timer = setTimeout(() => {
        onUpdate(input);
      }, 800);
      setSaveTimer(timer);
    },
    [saveTimer, onUpdate]
  );

  const handleMethodChange = (val: string) => {
    setMethod(val);
    debouncedSave({ ...buildInput(), method: val });
  };

  const handleUrlChange = (val: string) => {
    setUrl(val);
    debouncedSave({ ...buildInput(), url: val });
  };

  const handleHeadersChange = (val: KeyValuePair[]) => {
    setHeaders(val);
    debouncedSave({ ...buildInput(), headers: val });
  };

  const handleQueryParamsChange = (val: KeyValuePair[]) => {
    setQueryParams(val);
    debouncedSave({ ...buildInput(), query_params: val });
  };

  const handleBodyTypeChange = (val: string) => {
    setBodyType(val);
    debouncedSave({ ...buildInput(), body_type: val });
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    debouncedSave({ ...buildInput(), body: val });
  };

  const handleEnvVaultChange = (val: string) => {
    setEnvVaultId(val);
    debouncedSave({
      ...buildInput(),
      env_vault_id: val === "none" ? null : val,
    });
  };

  const handleSend = () => {
    if (!url.trim()) {
      toast.error(t("apiPlayground.urlRequired"));
      return;
    }
    const enabledHeaders = headers.filter((h) => h.enabled && h.key);
    onSend({
      method,
      url,
      headers: enabledHeaders,
      body: bodyType !== "none" ? body : "",
      env_vault_id: envVaultId === "none" ? null : envVaultId,
      request_id: request.id,
    });
  };

  const methodStyle = getMethodStyle(method);

  const curlCommand = useMemo(() => {
    const parts = ["curl"];
    if (method !== "GET") parts.push(`-X ${method}`);
    headers
      .filter((h) => h.enabled && h.key)
      .forEach((h) => parts.push(`-H '${h.key}: ${h.value}'`));
    if (bodyType !== "none" && body) {
      parts.push(`-d '${body.replace(/'/g, "'\\''")}'`);
    }
    const qp = queryParams.filter((p) => p.enabled && p.key);
    let finalUrl = url;
    if (qp.length > 0) {
      const qs = qp.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
      finalUrl += (url.includes("?") ? "&" : "?") + qs;
    }
    parts.push(`'${finalUrl}'`);
    return parts.join(" \\\n  ");
  }, [method, url, headers, queryParams, bodyType, body]);

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    toast.success(t("apiPlayground.curlCopied"));
  };

  const enabledParamCount = queryParams.filter((p) => p.enabled && p.key).length;
  const enabledHeaderCount = headers.filter((h) => h.enabled && h.key).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Method + URL + Send */}
      <div className="flex items-center gap-2">
        <Select value={method} onValueChange={handleMethodChange}>
          <SelectTrigger className={`h-9 w-28 font-mono text-sm font-bold ${methodStyle.color}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {httpMethods.map((m) => (
              <SelectItem key={m.value} value={m.value} className={`font-mono font-bold ${m.color}`}>
                {m.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder={t("apiPlayground.urlPlaceholder")}
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="h-9 flex-1 font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <Button
          onClick={handleSend}
          disabled={sending}
          className="h-9 gap-1.5"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {t("apiPlayground.send")}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={copyCurl}
          title={t("apiPlayground.copyAsCurl")}
        >
          <Copy className="size-4" />
        </Button>
      </div>

      {/* Env Vault selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t("apiPlayground.environment")}</span>
        <Select value={envVaultId} onValueChange={handleEnvVaultChange}>
          <SelectTrigger className="h-7 w-48 text-xs">
            <SelectValue placeholder={t("apiPlayground.noEnvironment")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("apiPlayground.noEnvironment")}</SelectItem>
            {envVaults.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="params" className="flex-1">
        <TabsList>
          <TabsTrigger value="params">
            {t("apiPlayground.tabParams")}{enabledParamCount > 0 && ` (${enabledParamCount})`}
          </TabsTrigger>
          <TabsTrigger value="headers">
            {t("apiPlayground.tabHeaders")}{enabledHeaderCount > 0 && ` (${enabledHeaderCount})`}
          </TabsTrigger>
          <TabsTrigger value="body">{t("apiPlayground.tabBody")}</TabsTrigger>
        </TabsList>
        <TabsContent value="params" className="mt-3">
          <ApiKeyValueEditor
            pairs={queryParams}
            onChange={handleQueryParamsChange}
            keyPlaceholder={t("apiPlayground.parameterPlaceholder")}
            valuePlaceholder={t("apiPlayground.valuePlaceholder")}
          />
        </TabsContent>
        <TabsContent value="headers" className="mt-3">
          <ApiKeyValueEditor
            pairs={headers}
            onChange={handleHeadersChange}
          />
        </TabsContent>
        <TabsContent value="body" className="mt-3 space-y-3">
          <Select value={bodyType} onValueChange={handleBodyTypeChange}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bodyTypes.map((bt) => (
                <SelectItem key={bt.value} value={bt.value}>
                  {bt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bodyType !== "none" && (
            <Textarea
              placeholder={
                bodyType === "json"
                  ? t("apiPlayground.bodyPlaceholderJson")
                  : t("apiPlayground.bodyPlaceholderRaw")
              }
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
