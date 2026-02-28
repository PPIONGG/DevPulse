"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  browseListings,
  getListing as getListingService,
  getMyListings,
  createListing as createListingService,
  updateListing as updateListingService,
  deleteListing as deleteListingService,
  purchaseListing as purchaseListingService,
  getMyPurchases,
  getReviews as getReviewsService,
  createReview as createReviewService,
  updateReview as updateReviewService,
  deleteReview as deleteReviewService,
  getSellerDashboard,
} from "@/lib/services/marketplace";
import type {
  Listing,
  ListingInput,
  Purchase,
  Review,
  ReviewInput,
  SellerStats,
} from "@/lib/types/database";
import { useAuth } from "@/providers/auth-provider";

export function useMarketplace() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [currentListing, setCurrentListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchListings = useCallback(
    async (params?: { search?: string; language?: string; sort?: string }) => {
      if (!user) {
        if (!authLoading) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await browseListings(params);
        if (mountedRef.current) {
          setListings(data);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch listings"
          );
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [user, authLoading]
  );

  const fetchMyListings = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getMyListings();
      if (mountedRef.current) {
        setMyListings(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch your listings"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  const fetchListing = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        setLoading(true);
        const data = await getListingService(id);
        if (mountedRef.current) {
          setCurrentListing(data);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch listing"
          );
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [user]
  );

  const fetchPurchases = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getMyPurchases();
      if (mountedRef.current) {
        setPurchases(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch purchases"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  const fetchReviews = useCallback(async (listingId: string) => {
    try {
      const data = await getReviewsService(listingId);
      if (mountedRef.current) {
        setReviews(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch reviews"
        );
      }
    }
  }, []);

  const fetchSellerStats = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSellerDashboard();
      if (mountedRef.current) {
        setSellerStats(data);
      }
    } catch {
      // silently fail for stats
    }
  }, [user]);

  const createListing = useCallback(
    async (input: ListingInput) => {
      if (!user) return;
      const created = await createListingService(input);
      if (mountedRef.current) {
        setMyListings((prev) => [created, ...prev]);
        toast.success("Listing created");
      }
      return created;
    },
    [user]
  );

  const updateListing = useCallback(
    async (id: string, input: ListingInput) => {
      const updated = await updateListingService(id, input);
      if (mountedRef.current) {
        setMyListings((prev) =>
          prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
        );
        toast.success("Listing updated");
      }
      return updated;
    },
    []
  );

  const deleteListing = useCallback(async (id: string) => {
    await deleteListingService(id);
    if (mountedRef.current) {
      setMyListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing deleted");
    }
  }, []);

  const purchaseListing = useCallback(
    async (listingId: string) => {
      if (!user) return;
      const purchase = await purchaseListingService(listingId);
      if (mountedRef.current) {
        // Mark listing as purchased in local state
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId
              ? { ...l, is_purchased: true, download_count: l.download_count + 1 }
              : l
          )
        );
        if (currentListing?.id === listingId) {
          setCurrentListing((prev) =>
            prev ? { ...prev, is_purchased: true, download_count: prev.download_count + 1 } : prev
          );
        }
        toast.success("Purchase completed!");
      }
      return purchase;
    },
    [user, currentListing]
  );

  const createReview = useCallback(
    async (listingId: string, input: ReviewInput) => {
      if (!user) return;
      const created = await createReviewService(listingId, input);
      if (mountedRef.current) {
        setReviews((prev) => [created, ...prev]);
        toast.success("Review submitted");
      }
      return created;
    },
    [user]
  );

  const updateReview = useCallback(
    async (reviewId: string, input: ReviewInput) => {
      const updated = await updateReviewService(reviewId, input);
      if (mountedRef.current) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? updated : r))
        );
        toast.success("Review updated");
      }
      return updated;
    },
    []
  );

  const deleteReview = useCallback(async (reviewId: string) => {
    await deleteReviewService(reviewId);
    if (mountedRef.current) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted");
    }
  }, []);

  return {
    listings,
    myListings,
    purchases,
    reviews,
    sellerStats,
    currentListing,
    loading,
    error,
    fetchListings,
    fetchMyListings,
    fetchListing,
    fetchPurchases,
    fetchReviews,
    fetchSellerStats,
    createListing,
    updateListing,
    deleteListing,
    purchaseListing,
    createReview,
    updateReview,
    deleteReview,
  };
}
