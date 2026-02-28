"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Braces, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JsonFormatter } from "@/components/json-formatter";
import { JsonConverter } from "@/components/json-converter";
import { JsonDiff } from "@/components/json-diff";
import { JsonTreeView } from "@/components/json-tree-view";
import { JsonDocumentCard } from "@/components/json-document-card";
import { JsonDocumentForm } from "@/components/json-document-form";
import { JsonDocumentCardSkeleton } from "@/components/skeletons";
import { useJsonDocuments } from "@/hooks/use-json-documents";
import { useTranslation } from "@/providers/language-provider";
import { toast } from "sonner";
import type { JsonDocument, JsonDocumentInput } from "@/lib/types/database";

export default function JsonToolsPage() {
  const {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite,
    refetch,
  } = useJsonDocuments();
  const { t } = useTranslation();

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<JsonDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<JsonDocument | null>(null);

  const filtered = useMemo(() => {
    let result = documents;
    if (showFavoritesOnly) {
      result = result.filter((d) => d.is_favorite);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [documents, search, showFavoritesOnly]);

  const detectFormat = (): "json" | "yaml" => {
    const trimmed = input.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      return "yaml";
    }
  };

  const handleSaveCurrent = () => {
    setEditingDocument(null);
    setFormOpen(true);
  };

  const handleCreate = async (data: JsonDocumentInput) => {
    await createDocument(data);
  };

  const handleEdit = (doc: JsonDocument) => {
    setEditingDocument(doc);
    setFormOpen(true);
  };

  const handleUpdate = async (data: JsonDocumentInput) => {
    if (!editingDocument) return;
    await updateDocument(editingDocument.id, data);
    setEditingDocument(null);
  };

  const handleDelete = async () => {
    if (!deletingDocument) return;
    try {
      await deleteDocument(deletingDocument.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("jsonTools.deleteFailed"));
    } finally {
      setDeletingDocument(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingDocument(null);
  };

  const handleLoadDocument = (doc: JsonDocument) => {
    setInput(doc.content);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("jsonTools.title")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("jsonTools.subtitle")}
          </p>
        </div>
        <Button onClick={handleSaveCurrent} disabled={!input.trim()}>
          <Plus className="mr-2 size-4" />
          {t("jsonTools.saveCurrent")}
        </Button>
      </div>

      <Tabs defaultValue="format">
        <TabsList>
          <TabsTrigger value="format">{t("jsonTools.tabFormat")}</TabsTrigger>
          <TabsTrigger value="convert">{t("jsonTools.tabConvert")}</TabsTrigger>
          <TabsTrigger value="diff">{t("jsonTools.tabDiff")}</TabsTrigger>
          <TabsTrigger value="tree">{t("jsonTools.tabTree")}</TabsTrigger>
        </TabsList>

        <TabsContent value="format">
          <JsonFormatter input={input} onInputChange={setInput} />
        </TabsContent>

        <TabsContent value="convert">
          <JsonConverter input={input} onInputChange={setInput} />
        </TabsContent>

        <TabsContent value="diff">
          <JsonDiff />
        </TabsContent>

        <TabsContent value="tree">
          <JsonTreeView input={input} onInputChange={setInput} />
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("jsonTools.savedDocuments")}</h3>
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("jsonTools.searchPlaceholder")}
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="icon"
              className="size-9"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title={showFavoritesOnly ? t("jsonTools.showAll") : t("jsonTools.showFavorites")}
            >
              <Star className={`size-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>{error}</p>
            <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
              {t("common.tryAgain")}
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <JsonDocumentCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Braces className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">
              {search.trim() || showFavoritesOnly
                ? t("jsonTools.noMatch")
                : t("jsonTools.empty")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search.trim() || showFavoritesOnly
                ? t("jsonTools.noMatchDesc")
                : t("jsonTools.emptyDesc")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => (
              <JsonDocumentCard
                key={doc.id}
                document={doc}
                onEdit={handleEdit}
                onDelete={setDeletingDocument}
                onToggleFavorite={toggleFavorite}
                onLoad={handleLoadDocument}
              />
            ))}
          </div>
        )}
      </div>

      <JsonDocumentForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        document={editingDocument}
        onSubmit={editingDocument ? handleUpdate : handleCreate}
        initialContent={!editingDocument ? input : undefined}
        initialFormat={!editingDocument ? detectFormat() : undefined}
      />

      <AlertDialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("jsonTools.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("jsonTools.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
