"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Store, ShoppingBag, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingCard } from "@/components/listing-card";
import { useMarketplace } from "@/hooks/use-marketplace";
import { sortOptions } from "@/config/marketplace";
import type { SortOption } from "@/config/marketplace";
import { useTranslation } from "@/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n";
import { languages } from "@/config/languages";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const sortLabelKeys: Record<SortOption, TranslationKey> = {
  newest: "marketplace.sortNewest",
  price_asc: "marketplace.sortPriceAsc",
  price_desc: "marketplace.sortPriceDesc",
  rating: "marketplace.sortRating",
  downloads: "marketplace.sortDownloads",
};

function ListingCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
      <Skeleton className="mx-4 mb-2 h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-12" />
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const {
    listings,
    loading,
    error,
    fetchListings,
    purchaseListing,
  } = useMarketplace();

  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetchListings({ search: search.trim() || undefined, language, sort });
  }, [fetchListings, search, language, sort]);

  const availableLanguages = useMemo(() => {
    const langs = [...new Set(listings.map((l) => l.language))];
    langs.sort();
    return langs;
  }, [listings]);

  const languageLabelMap = useMemo(
    () => Object.fromEntries(languages.map((l) => [l.value, l.label])),
    []
  );

  const hasFilters = search.trim() || language !== "all";

  const handlePurchase = async (listing: typeof listings[0]) => {
    try {
      await purchaseListing(listing.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("marketplace.purchaseFailed")
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("marketplace.title")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("marketplace.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketplace/purchases">
              <ShoppingBag className="mr-2 size-4" />
              {t("marketplace.purchases")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/marketplace/my-listings">
              <Package className="mr-2 size-4" />
              {t("marketplace.myListings")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("marketplace.searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("marketplace.allLanguages")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("marketplace.allLanguages")}</SelectItem>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {languageLabelMap[lang] ?? lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("marketplace.sortBy")} />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(sortLabelKeys[opt.value])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={() => fetchListings({ search: search.trim() || undefined, language, sort })}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Store className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {hasFilters ? t("marketplace.noMatch") : t("marketplace.empty")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? t("marketplace.noMatchDesc")
              : t("marketplace.emptyDesc")}
          </p>
          {!hasFilters && (
            <Button className="mt-4" asChild>
              <Link href="/marketplace/my-listings">{t("marketplace.createListing")}</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPurchase={handlePurchase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
