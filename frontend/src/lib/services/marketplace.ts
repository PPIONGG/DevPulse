import { api } from "@/lib/api/client";
import type {
  Listing,
  ListingInput,
  Purchase,
  Review,
  ReviewInput,
  SellerStats,
} from "@/lib/types/database";

export async function browseListings(params?: {
  search?: string;
  language?: string;
  sort?: string;
}): Promise<Listing[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.language && params.language !== "all")
    query.set("language", params.language);
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return api.get<Listing[]>(`/api/marketplace/listings${qs ? `?${qs}` : ""}`);
}

export async function getListing(id: string): Promise<Listing> {
  return api.get<Listing>(`/api/marketplace/listings/${id}`);
}

export async function getMyListings(): Promise<Listing[]> {
  return api.get<Listing[]>("/api/marketplace/my-listings");
}

export async function createListing(input: ListingInput): Promise<Listing> {
  return api.post<Listing>("/api/marketplace/listings", input);
}

export async function updateListing(
  id: string,
  input: ListingInput
): Promise<Listing> {
  return api.put<Listing>(`/api/marketplace/listings/${id}`, input);
}

export async function deleteListing(id: string): Promise<void> {
  await api.delete(`/api/marketplace/listings/${id}`);
}

export async function purchaseListing(
  listingId: string
): Promise<Purchase> {
  return api.post<Purchase>("/api/marketplace/purchase", {
    listing_id: listingId,
  });
}

export async function getMyPurchases(): Promise<Purchase[]> {
  return api.get<Purchase[]>("/api/marketplace/purchases");
}

export async function getReviews(listingId: string): Promise<Review[]> {
  return api.get<Review[]>(`/api/marketplace/listings/${listingId}/reviews`);
}

export async function createReview(
  listingId: string,
  input: ReviewInput
): Promise<Review> {
  return api.post<Review>(
    `/api/marketplace/listings/${listingId}/reviews`,
    input
  );
}

export async function updateReview(
  reviewId: string,
  input: ReviewInput
): Promise<Review> {
  return api.put<Review>(`/api/marketplace/reviews/${reviewId}`, input);
}

export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete(`/api/marketplace/reviews/${reviewId}`);
}

export async function getSellerDashboard(): Promise<SellerStats> {
  return api.get<SellerStats>("/api/marketplace/seller/dashboard");
}
