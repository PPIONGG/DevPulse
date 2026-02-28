"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Download,
  User,
  Pencil,
  Trash2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { CodeBlock } from "@/components/code-block";
import { ReviewForm } from "@/components/review-form";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useAuth } from "@/providers/auth-provider";
import { formatPrice, formatRating } from "@/config/marketplace";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import type { Review, ReviewInput } from "@/lib/types/database";

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;
  const { user } = useAuth();

  const {
    currentListing: listing,
    reviews,
    loading,
    error,
    fetchListing,
    fetchReviews,
    purchaseListing,
    createReview,
    updateReview,
    deleteReview,
  } = useMarketplace();

  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (listingId) {
      fetchListing(listingId);
      fetchReviews(listingId);
    }
  }, [listingId, fetchListing, fetchReviews]);

  const handlePurchase = useCallback(async () => {
    if (!listing) return;
    try {
      await purchaseListing(listing.id);
      // Re-fetch to get full_code
      fetchListing(listingId);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to purchase listing"
      );
    }
  }, [listing, purchaseListing, fetchListing, listingId]);

  const handleCreateReview = async (input: ReviewInput) => {
    await createReview(listingId, input);
    fetchReviews(listingId);
  };

  const handleUpdateReview = async (input: ReviewInput) => {
    if (!editingReview) return;
    await updateReview(editingReview.id, input);
    setEditingReview(null);
    fetchReviews(listingId);
  };

  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    try {
      await deleteReview(deletingReview.id);
      fetchReviews(listingId);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete review"
      );
    } finally {
      setDeletingReview(null);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setReviewFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setReviewFormOpen(open);
    if (!open) setEditingReview(null);
  };

  const isOwner = listing && user && listing.seller_id === user.id;
  const canAccessFullCode = isOwner || listing?.is_purchased;
  const userReview = reviews.find((r) => r.buyer_id === user?.id);
  const canReview = listing?.is_purchased && !userReview;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 size-4" />
            Back to Marketplace
          </Link>
        </Button>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={() => fetchListing(listingId)}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/marketplace">
          <ArrowLeft className="mr-2 size-4" />
          Back to Marketplace
        </Link>
      </Button>

      {/* Listing header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {listing.title}
          </h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="size-4" />
              {listing.seller_name || "Anonymous"}
            </div>
            {listing.review_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                {formatRating(listing.avg_rating)} ({listing.review_count}{" "}
                {listing.review_count === 1 ? "review" : "reviews"})
              </div>
            )}
            <div className="flex items-center gap-1">
              <Download className="size-4" />
              {listing.download_count}{" "}
              {listing.download_count === 1 ? "download" : "downloads"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">
            {formatPrice(listing.price_cents, listing.currency)}
          </span>
          {!isOwner &&
            (listing.is_purchased ? (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
              >
                Purchased
              </Badge>
            ) : (
              <Button onClick={handlePurchase}>
                {listing.price_cents === 0 ? "Get Free" : "Buy Now"}
              </Button>
            ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{listing.language}</Badge>
        {listing.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Description */}
      {listing.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {listing.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview Code */}
      {listing.preview_code && (
        <Card className="overflow-hidden py-0">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CodeBlock
              code={listing.preview_code}
              language={listing.language}
            />
          </CardContent>
        </Card>
      )}

      {/* Full Code */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Full Code</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {canAccessFullCode && listing.full_code ? (
            <CodeBlock
              code={listing.full_code}
              language={listing.language}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Lock className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Purchase this listing to access the full source code.
              </p>
              {!isOwner && !listing.is_purchased && (
                <Button onClick={handlePurchase}>
                  {listing.price_cents === 0 ? "Get Free" : "Buy to Unlock"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Reviews ({reviews.length})
          </h3>
          {canReview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewFormOpen(true)}
            >
              Write a Review
            </Button>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id} className="gap-0 py-0">
                <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {review.buyer_name || "Anonymous"}
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <Star
                              key={v}
                              className={cn(
                                "size-3.5",
                                v <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  {review.buyer_id === user?.id && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleEditReview(review)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() => setDeletingReview(review)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                {review.comment && (
                  <div className="px-4 pb-3">
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <ReviewForm
        open={reviewFormOpen}
        onOpenChange={handleFormOpenChange}
        review={editingReview}
        onSubmit={editingReview ? handleUpdateReview : handleCreateReview}
      />

      <AlertDialog
        open={!!deletingReview}
        onOpenChange={(open) => !open && setDeletingReview(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your review. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
