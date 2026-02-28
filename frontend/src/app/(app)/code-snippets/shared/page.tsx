"use client";

import { useState, useMemo } from "react";
import { Search, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SnippetCard } from "@/components/snippet-card";
import { SnippetCardSkeleton } from "@/components/skeletons";
import { useSharedSnippets } from "@/hooks/use-shared-snippets";
import { useTranslation } from "@/providers/language-provider";
import { languages } from "@/config/languages";

const languageLabelMap = Object.fromEntries(
  languages.map((l) => [l.value, l.label])
);

export default function SharedSnippetsPage() {
  const { snippets, loading, error, refetch, copyToMine } = useSharedSnippets();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("snippets.sharedTitle")}</h2>
        <p className="mt-1 text-muted-foreground">
          {t("snippets.sharedSubtitle")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("snippets.searchSharedPlaceholder")}
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
          <Globe className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {hasFilters ? t("snippets.noMatch") : t("snippets.sharedEmpty")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? t("snippets.noMatchDesc")
              : t("snippets.sharedEmptyDesc")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} readOnly onCopy={(s) => copyToMine(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
