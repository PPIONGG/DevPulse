"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Code2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SnippetCard } from "@/components/snippet-card";
import { SnippetForm } from "@/components/snippet-form";
import { SnippetCardSkeleton } from "@/components/skeletons";
import { useSnippets } from "@/hooks/use-snippets";
import { useTranslation } from "@/providers/language-provider";
import { toast } from "sonner";
import { languages } from "@/config/languages";
import type { CodeSnippet, CodeSnippetInput } from "@/lib/types/database";

const languageLabelMap = Object.fromEntries(
  languages.map((l) => [l.value, l.label])
);

export default function MySnippetsPage() {
  const {
    snippets,
    loading,
    error,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleFavorite,
    refetch,
  } = useSnippets();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(
    null
  );
  const [deletingSnippet, setDeletingSnippet] = useState<CodeSnippet | null>(
    null
  );

  const availableLanguages = useMemo(() => {
    const langs = [...new Set(snippets.map((s) => s.language))];
    langs.sort((a, b) =>
      (languageLabelMap[a] ?? a).localeCompare(languageLabelMap[b] ?? b)
    );
    return langs;
  }, [snippets]);

  const filtered = useMemo(() => {
    let result = snippets;
    if (language !== "all") {
      result = result.filter((s) => s.language === language);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.language.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [snippets, search, language]);

  const hasFilters = search.trim() || language !== "all";

  const handleCreate = async (data: CodeSnippetInput) => {
    await createSnippet(data);
  };

  const handleEdit = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet);
    setFormOpen(true);
  };

  const handleUpdate = async (data: CodeSnippetInput) => {
    if (!editingSnippet) return;
    await updateSnippet(editingSnippet.id, data);
    setEditingSnippet(null);
  };

  const handleDelete = async () => {
    if (!deletingSnippet) return;
    try {
      await deleteSnippet(deletingSnippet.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("snippets.deleteFailed"));
    } finally {
      setDeletingSnippet(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingSnippet(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("snippets.myTitle")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("snippets.mySubtitle")}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t("snippets.new")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("snippets.searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("snippets.allLanguages")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("snippets.allLanguages")}</SelectItem>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {languageLabelMap[lang] ?? lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SnippetCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Code2 className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {hasFilters ? t("snippets.noMatch") : t("snippets.empty")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? t("snippets.noMatchDesc")
              : t("snippets.emptyDesc")}
          </p>
          {!hasFilters && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              {t("snippets.new")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onEdit={handleEdit}
              onDelete={setDeletingSnippet}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <SnippetForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        snippet={editingSnippet}
        onSubmit={editingSnippet ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingSnippet}
        onOpenChange={(open) => !open && setDeletingSnippet(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("snippets.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("snippets.deleteDesc")}
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
