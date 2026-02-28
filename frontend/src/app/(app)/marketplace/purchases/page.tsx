"use client";

import { useEffect } from "react";
import { ShoppingBag, User } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useTranslation } from "@/providers/language-provider";
import { formatPrice } from "@/config/marketplace";
import Link from "next/link";

function PurchaseCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const { t } = useTranslation();
  const { purchases, loading, error, fetchPurchases } = useMarketplace();

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("marketplace.purchasesTitle")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("marketplace.purchasesSubtitle")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/marketplace">{t("marketplace.browseMarketplace")}</Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={fetchPurchases}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PurchaseCardSkeleton key={i} />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">{t("marketplace.noPurchases")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("marketplace.noPurchasesDesc")}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/marketplace">{t("marketplace.browseMarketplace")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="gap-0 py-0">
              <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="truncate text-base">
                      <Link
                        href={`/marketplace/${purchase.listing_id}`}
                        className="hover:underline"
                      >
                        {purchase.listing_title || t("marketplace.listing")}
                      </Link>
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {purchase.listing_language || "code"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="size-3" />
                    <span>{purchase.seller_name || t("marketplace.anonymous")}</span>
                    <span className="text-border">|</span>
                    <span>
                      {purchase.purchased_at
                        ? new Date(purchase.purchased_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatPrice(purchase.amount_cents, purchase.currency, t("marketplace.free"))}
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                  >
                    {purchase.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
