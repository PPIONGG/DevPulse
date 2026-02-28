"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Pencil,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMethodStyle } from "@/config/api-playground";
import { useTranslation } from "@/providers/language-provider";
import { cn } from "@/lib/utils";
import type { ApiCollection, ApiRequest } from "@/lib/types/database";

interface ApiSidebarProps {
  collections: ApiCollection[];
  uncollected: ApiRequest[];
  activeRequestId: string | null;
  onSelectRequest: (req: ApiRequest) => void;
  onNewRequest: () => void;
  onNewCollection: () => void;
  onEditCollection: (col: ApiCollection) => void;
  onDeleteCollection: (col: ApiCollection) => void;
  onDeleteRequest: (req: ApiRequest) => void;
}

export function ApiSidebar({
  collections,
  uncollected,
  activeRequestId,
  onSelectRequest,
  onNewRequest,
  onNewCollection,
  onEditCollection,
  onDeleteCollection,
  onDeleteRequest,
}: ApiSidebarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [openCollections, setOpenCollections] = useState<Set<string>>(
    new Set(collections.map((c) => c.id))
  );

  const toggleCollection = (id: string) => {
    setOpenCollections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const matchesSearch = (req: ApiRequest) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      req.title.toLowerCase().includes(q) ||
      req.method.toLowerCase().includes(q) ||
      req.url.toLowerCase().includes(q)
    );
  };

  const filteredCollections = collections
    .map((col) => ({
      ...col,
      requests: col.requests.filter(matchesSearch),
    }))
    .filter(
      (col) =>
        col.requests.length > 0 ||
        (!search.trim() && col.title.toLowerCase().includes(search.toLowerCase()))
    );

  const filteredUncollected = uncollected.filter(matchesSearch);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={onNewRequest}
          >
            <Plus className="mr-1 size-3" />
            {t("apiPlayground.request")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onNewCollection}
          >
            <FolderOpen className="mr-1 size-3" />
            {t("apiPlayground.collection")}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("apiPlayground.searchPlaceholder")}
            className="h-7 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 pb-3">
        {filteredCollections.map((col) => (
          <Collapsible
            key={col.id}
            open={openCollections.has(col.id)}
            onOpenChange={() => toggleCollection(col.id)}
          >
            <div className="group flex items-center gap-0.5 rounded-md px-1.5 py-1 hover:bg-muted/50">
              <CollapsibleTrigger asChild>
                <button className="flex flex-1 items-center gap-1 text-left text-xs font-medium">
                  <ChevronRight
                    className={cn(
                      "size-3.5 shrink-0 transition-transform",
                      openCollections.has(col.id) && "rotate-90"
                    )}
                  />
                  <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{col.title}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {col.requests.length}
                  </span>
                </button>
              </CollapsibleTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onEditCollection(col)}>
                    <Pencil className="mr-2 size-3.5" />
                    {t("common.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteCollection(col)}
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    {t("common.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CollapsibleContent>
              <div className="ml-3 border-l pl-2">
                {col.requests.map((req) => (
                  <RequestItem
                    key={req.id}
                    request={req}
                    isActive={req.id === activeRequestId}
                    onSelect={() => onSelectRequest(req)}
                    onDelete={() => onDeleteRequest(req)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        {filteredUncollected.length > 0 && (
          <div className="mt-2">
            {filteredCollections.length > 0 && (
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("apiPlayground.uncollected")}
              </div>
            )}
            {filteredUncollected.map((req) => (
              <RequestItem
                key={req.id}
                request={req}
                isActive={req.id === activeRequestId}
                onSelect={() => onSelectRequest(req)}
                onDelete={() => onDeleteRequest(req)}
              />
            ))}
          </div>
        )}

        {filteredCollections.length === 0 && filteredUncollected.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              {search.trim() ? t("apiPlayground.noMatchingRequests") : t("apiPlayground.noRequestsYet")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestItem({
  request,
  isActive,
  onSelect,
  onDelete,
}: {
  request: ApiRequest;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const methodStyle = getMethodStyle(request.method);

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-muted/50",
        isActive && "bg-muted"
      )}
      onClick={onSelect}
    >
      <span className={cn("shrink-0 font-mono text-[10px] font-bold", methodStyle.color)}>
        {request.method.slice(0, 3)}
      </span>
      <span className="flex-1 truncate">{request.title}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}
