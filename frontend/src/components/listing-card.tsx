"use client";

import { Star, Download, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";
import { useTranslation } from "@/providers/language-provider";
import { formatPrice, formatRating } from "@/config/marketplace";
import type { Listing } from "@/lib/types/database";
import Link from "next/link";

interface ListingCardProps {
  listing: Listing;
  onPurchase?: (listing: Listing) => void;
  showActions?: boolean;
}

export function ListingCard({
  listing,
  onPurchase,
  showActions = true,
}: ListingCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="truncate text-base">
              <Link
                href={`/marketplace/${listing.id}`}
                className="hover:underline"
              >
                {listing.title}
              </Link>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="size-3" />
            <span>{listing.seller_name || t("marketplace.anonymous")}</span>
            {listing.review_count > 0 && (
              <>
                <span className="text-border">|</span>
                <Star className="size-3 fill-yellow-400 text-yellow-400" />
                <span>{formatRating(listing.avg_rating, t("marketplace.noRatings"))}</span>
                <span className="text-border">({listing.review_count})</span>
              </>
            )}
            {listing.download_count > 0 && (
              <>
                <span className="text-border">|</span>
                <Download className="size-3" />
                <span>{listing.download_count}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {listing.language}
          </Badge>
          <span className="text-sm font-semibold">
            {formatPrice(listing.price_cents, listing.currency, t("marketplace.free"))}
          </span>
        </div>
      </CardHeader>

      {listing.description && (
        <div className="px-4 pb-2">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {listing.description}
          </p>
        </div>
      )}

      {listing.preview_code && (
        <CardContent className="p-0">
          <CodeBlock
            code={listing.preview_code}
            language={listing.language}
            maxLines={8}
          />
        </CardContent>
      )}

      {(listing.tags.length > 0 || showActions) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {listing.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          {showActions && (
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/marketplace/${listing.id}`}>{t("marketplace.preview")}</Link>
              </Button>
              {listing.is_purchased ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                >
                  {t("marketplace.purchased")}
                </Badge>
              ) : (
                onPurchase && (
                  <Button size="sm" onClick={() => onPurchase(listing)}>
                    {listing.price_cents === 0 ? t("marketplace.getFree") : t("marketplace.buyNow")}
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
