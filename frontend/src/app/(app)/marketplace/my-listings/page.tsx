"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Package,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ListingForm } from "@/components/listing-form";
import { useMarketplace } from "@/hooks/use-marketplace";
import { formatPrice, formatRating } from "@/config/marketplace";
import { toast } from "sonner";
import type { Listing, ListingInput } from "@/lib/types/database";
import Link from "next/link";

function MyListingCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="size-8" />
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const {
    myListings,
    sellerStats,
    loading,
    error,
    fetchMyListings,
    fetchSellerStats,
    createListing,
    updateListing,
    deleteListing,
  } = useMarketplace();

  const [formOpen, setFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);

  useEffect(() => {
    fetchMyListings();
    fetchSellerStats();
  }, [fetchMyListings, fetchSellerStats]);

  const handleCreate = async (data: ListingInput) => {
    await createListing(data);
  };

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setFormOpen(true);
  };

  const handleUpdate = async (data: ListingInput) => {
    if (!editingListing) return;
    await updateListing(editingListing.id, data);
    setEditingListing(null);
  };

  const handleTogglePublish = async (listing: Listing) => {
    try {
      await updateListing(listing.id, {
        title: listing.title,
        description: listing.description,
        preview_code: listing.preview_code,
        full_code: listing.full_code,
        language: listing.language,
        tags: listing.tags,
        price_cents: listing.price_cents,
        currency: listing.currency,
        is_published: !listing.is_published,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update listing"
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingListing) return;
    try {
      await deleteListing(deletingListing.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete listing"
      );
    } finally {
      setDeletingListing(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingListing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Listings</h2>
          <p className="mt-1 text-muted-foreground">
            Manage your marketplace listings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Listing
          </Button>
        </div>
      </div>

      {/* Seller Stats */}
      {sellerStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="py-4">
            <CardHeader className="px-4 py-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="size-3.5" />
                Total Sales
              </div>
              <CardTitle className="text-2xl">{sellerStats.total_sales}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="py-4">
            <CardHeader className="px-4 py-0">
              <div className="text-xs text-muted-foreground">Revenue</div>
              <CardTitle className="text-2xl">
                {formatPrice(sellerStats.total_revenue, "usd")}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="py-4">
            <CardHeader className="px-4 py-0">
              <div className="text-xs text-muted-foreground">Active</div>
              <CardTitle className="text-2xl">
                {sellerStats.active_listings}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="py-4">
            <CardHeader className="px-4 py-0">
              <div className="text-xs text-muted-foreground">Total</div>
              <CardTitle className="text-2xl">
                {sellerStats.total_listings}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={fetchMyListings}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MyListingCardSkeleton key={i} />
          ))}
        </div>
      ) : myListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No listings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first listing to start selling snippets.
          </p>
          <Button className="mt-4" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Listing
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {myListings.map((listing) => (
            <Card key={listing.id} className="gap-0 py-0">
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
                    <Badge
                      variant={listing.is_published ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {listing.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {listing.language}
                    </Badge>
                    <span>{formatPrice(listing.price_cents, listing.currency)}</span>
                    <span className="text-border">|</span>
                    <span>
                      {listing.download_count}{" "}
                      {listing.download_count === 1 ? "sale" : "sales"}
                    </span>
                    {listing.review_count > 0 && (
                      <>
                        <span className="text-border">|</span>
                        <span>{formatRating(listing.avg_rating)} stars</span>
                      </>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleTogglePublish(listing)}>
                      {listing.is_published ? (
                        <>
                          <EyeOff className="mr-2 size-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 size-4" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(listing)}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeletingListing(listing)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <ListingForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        listing={editingListing}
        onSubmit={editingListing ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingListing}
        onOpenChange={(open) => !open && setDeletingListing(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingListing?.title}&quot;
              and all associated purchases and reviews. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
