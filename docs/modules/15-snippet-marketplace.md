# Module 15 — Snippet Marketplace (E-Commerce)

> Difficulty: ⭐⭐⭐⭐⭐ | Four new tables | New packages: @stripe/stripe-js | Requires: Stripe account

## Overview

A marketplace where users can sell and buy premium code snippets, templates, and components. Sellers create listings with a price, preview code, and full code that is only revealed after purchase. Buyers pay via Stripe Checkout. Includes seller dashboard with revenue tracking, buyer purchase library, and a rating/review system.

## Prerequisites

- **Stripe account** with API keys (publishable + secret)
- **Stripe Webhook** endpoint configured for checkout events
- **Stripe Connect** (optional, for direct seller payouts — can start without it)

## Environment Variables

```bash
# Add to .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=10   # platform fee percentage
```

```bash
# Add to frontend/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## PostgreSQL Migration

```sql
-- backend/database/migrations/019_create_marketplace.up.sql

CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    preview_code TEXT NOT NULL DEFAULT '',        -- visible to everyone
    full_code TEXT NOT NULL DEFAULT '',           -- visible only after purchase
    language TEXT NOT NULL DEFAULT 'javascript',
    tags TEXT[] NOT NULL DEFAULT '{}',
    price_cents INTEGER NOT NULL DEFAULT 0,       -- price in cents (0 = free)
    currency TEXT NOT NULL DEFAULT 'usd',
    is_published BOOLEAN NOT NULL DEFAULT false,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    stripe_session_id TEXT,                       -- Stripe Checkout session ID
    stripe_payment_intent TEXT,                   -- Stripe payment intent ID
    amount_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(buyer_id, listing_id)                  -- one purchase per listing per buyer
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(buyer_id, listing_id)                  -- one review per purchase
);

CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    stripe_account_id TEXT,                       -- Stripe Connect account (future)
    bio TEXT NOT NULL DEFAULT '',
    total_sales INTEGER NOT NULL DEFAULT 0,
    total_revenue_cents INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_published ON listings(is_published);
CREATE INDEX IF NOT EXISTS idx_listings_language ON listings(language);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_cents);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_listing_id ON purchases(listing_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
```

## Go Backend

### Model

```go
// backend/models/marketplace.go

type Listing struct {
    ID            uuid.UUID `json:"id"`
    SellerID      uuid.UUID `json:"seller_id"`
    Title         string    `json:"title"`
    Description   string    `json:"description"`
    PreviewCode   string    `json:"preview_code"`
    FullCode      string    `json:"full_code,omitempty"` // omitted unless purchased
    Language      string    `json:"language"`
    Tags          []string  `json:"tags"`
    PriceCents    int       `json:"price_cents"`
    Currency      string    `json:"currency"`
    IsPublished   bool      `json:"is_published"`
    DownloadCount int       `json:"download_count"`
    CreatedAt     time.Time `json:"created_at"`
    UpdatedAt     time.Time `json:"updated_at"`
    // Joined fields
    SellerName    string    `json:"seller_name,omitempty"`
    AvgRating     float64   `json:"avg_rating"`
    ReviewCount   int       `json:"review_count"`
    IsPurchased   bool      `json:"is_purchased"` // for current viewer
}

type ListingInput struct {
    Title       string   `json:"title"`
    Description string   `json:"description"`
    PreviewCode string   `json:"preview_code"`
    FullCode    string   `json:"full_code"`
    Language    string   `json:"language"`
    Tags        []string `json:"tags"`
    PriceCents  int      `json:"price_cents"`
    Currency    string   `json:"currency"`
    IsPublished bool     `json:"is_published"`
}

type Purchase struct {
    ID                  uuid.UUID  `json:"id"`
    BuyerID             uuid.UUID  `json:"buyer_id"`
    ListingID           uuid.UUID  `json:"listing_id"`
    StripeSessionID     *string    `json:"stripe_session_id,omitempty"`
    StripePaymentIntent *string    `json:"stripe_payment_intent,omitempty"`
    AmountCents         int        `json:"amount_cents"`
    PlatformFeeCents    int        `json:"platform_fee_cents"`
    Currency            string     `json:"currency"`
    Status              string     `json:"status"`
    PurchasedAt         *time.Time `json:"purchased_at"`
    CreatedAt           time.Time  `json:"created_at"`
}

type Review struct {
    ID        uuid.UUID `json:"id"`
    BuyerID   uuid.UUID `json:"buyer_id"`
    ListingID uuid.UUID `json:"listing_id"`
    Rating    int       `json:"rating"`
    Comment   string    `json:"comment"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    // Joined
    BuyerName string   `json:"buyer_name,omitempty"`
}

type ReviewInput struct {
    Rating  int    `json:"rating"`
    Comment string `json:"comment"`
}

type SellerDashboard struct {
    TotalSales       int     `json:"total_sales"`
    TotalRevenue     float64 `json:"total_revenue"`
    ActiveListings   int     `json:"active_listings"`
    AvgRating        float64 `json:"avg_rating"`
    RecentSales      []Purchase `json:"recent_sales"`
    MonthlySales     []MonthlyStat `json:"monthly_sales"`
}

type MonthlyStat struct {
    Month   string  `json:"month"` // "2026-02"
    Sales   int     `json:"sales"`
    Revenue float64 `json:"revenue"`
}
```

### Handler

```go
// backend/handlers/marketplace.go

type MarketplaceHandler struct {
    listingRepo  *ListingRepo
    purchaseRepo *PurchaseRepo
    reviewRepo   *ReviewRepo
    sellerRepo   *SellerProfileRepo
    stripeKey    string
}

// Browse (public-ish — requires auth but shows all published listings)
func (h *MarketplaceHandler) BrowseListings(w, r)     // GET  /api/marketplace/listings?q=&lang=&min_price=&max_price=&sort=
func (h *MarketplaceHandler) GetListing(w, r)          // GET  /api/marketplace/listings/{id}
// Returns full_code ONLY if buyer has completed purchase or is the seller

// Seller
func (h *MarketplaceHandler) MyListings(w, r)          // GET  /api/marketplace/my-listings
func (h *MarketplaceHandler) CreateListing(w, r)        // POST /api/marketplace/listings
func (h *MarketplaceHandler) UpdateListing(w, r)        // PUT  /api/marketplace/listings/{id}
func (h *MarketplaceHandler) DeleteListing(w, r)        // DELETE /api/marketplace/listings/{id}
func (h *MarketplaceHandler) SellerDashboard(w, r)      // GET  /api/marketplace/seller/dashboard

// Purchase
func (h *MarketplaceHandler) CreateCheckout(w, r)       // POST /api/marketplace/checkout
// 1. Verify listing exists and is published
// 2. Check buyer hasn't already purchased
// 3. If price == 0: create purchase directly with status=completed
// 4. If price > 0: create Stripe Checkout session, return session URL
// 5. Save pending purchase record

func (h *MarketplaceHandler) StripeWebhook(w, r)        // POST /api/marketplace/webhook (NO auth)
// Handles: checkout.session.completed
// 1. Verify webhook signature
// 2. Find purchase by stripe_session_id
// 3. Update status to "completed", set purchased_at
// 4. Increment listing download_count
// 5. Update seller total_sales and total_revenue_cents

func (h *MarketplaceHandler) MyPurchases(w, r)          // GET  /api/marketplace/purchases

// Reviews
func (h *MarketplaceHandler) GetReviews(w, r)           // GET  /api/marketplace/listings/{id}/reviews
func (h *MarketplaceHandler) CreateReview(w, r)          // POST /api/marketplace/listings/{id}/reviews
func (h *MarketplaceHandler) UpdateReview(w, r)          // PUT  /api/marketplace/reviews/{id}
func (h *MarketplaceHandler) DeleteReview(w, r)          // DELETE /api/marketplace/reviews/{id}
```

### Routes

```go
// Add to backend/router/router.go

// Browse (authenticated)
mux.Handle("GET /api/marketplace/listings", authMW(http.HandlerFunc(marketplace.BrowseListings)))
mux.Handle("GET /api/marketplace/listings/{id}", authMW(http.HandlerFunc(marketplace.GetListing)))

// Seller
mux.Handle("GET /api/marketplace/my-listings", authMW(http.HandlerFunc(marketplace.MyListings)))
mux.Handle("POST /api/marketplace/listings", authMW(http.HandlerFunc(marketplace.CreateListing)))
mux.Handle("PUT /api/marketplace/listings/{id}", authMW(http.HandlerFunc(marketplace.UpdateListing)))
mux.Handle("DELETE /api/marketplace/listings/{id}", authMW(http.HandlerFunc(marketplace.DeleteListing)))
mux.Handle("GET /api/marketplace/seller/dashboard", authMW(http.HandlerFunc(marketplace.SellerDashboard)))

// Purchase
mux.Handle("POST /api/marketplace/checkout", authMW(http.HandlerFunc(marketplace.CreateCheckout)))
mux.Handle("GET /api/marketplace/purchases", authMW(http.HandlerFunc(marketplace.MyPurchases)))

// Webhook (NO auth — Stripe calls this directly)
mux.Handle("POST /api/marketplace/webhook", http.HandlerFunc(marketplace.StripeWebhook))

// Reviews
mux.Handle("GET /api/marketplace/listings/{id}/reviews", authMW(http.HandlerFunc(marketplace.GetReviews)))
mux.Handle("POST /api/marketplace/listings/{id}/reviews", authMW(http.HandlerFunc(marketplace.CreateReview)))
mux.Handle("PUT /api/marketplace/reviews/{id}", authMW(http.HandlerFunc(marketplace.UpdateReview)))
mux.Handle("DELETE /api/marketplace/reviews/{id}", authMW(http.HandlerFunc(marketplace.DeleteReview)))
```

## TypeScript Types

```ts
// Add to lib/types/database.ts

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  preview_code: string;
  full_code?: string;         // only present if purchased or is seller
  language: string;
  tags: string[];
  price_cents: number;
  currency: string;
  is_published: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  seller_name?: string;
  avg_rating: number;
  review_count: number;
  is_purchased: boolean;
}

export type ListingInput = Pick<
  Listing,
  "title" | "description" | "preview_code" | "language" | "tags" | "price_cents" | "currency" | "is_published"
> & { full_code: string };

export interface Purchase {
  id: string;
  buyer_id: string;
  listing_id: string;
  amount_cents: number;
  currency: string;
  status: "pending" | "completed" | "refunded" | "failed";
  purchased_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  buyer_id: string;
  listing_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  buyer_name?: string;
}

export type ReviewInput = Pick<Review, "rating" | "comment">;

export interface SellerDashboard {
  total_sales: number;
  total_revenue: number;
  active_listings: number;
  avg_rating: number;
  recent_sales: Purchase[];
  monthly_sales: { month: string; sales: number; revenue: number }[];
}
```

## Service Functions

```ts
// lib/services/marketplace.ts

import { api } from "@/lib/api/client";
import type { Listing, ListingInput, Purchase, Review, ReviewInput, SellerDashboard } from "@/lib/types/database";

// Browse
export async function browseListings(params?: {
  q?: string; language?: string; min_price?: number; max_price?: number; sort?: string;
}): Promise<Listing[]> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return api.get(`/api/marketplace/listings${query ? `?${query}` : ""}`);
}

export async function getListing(id: string): Promise<Listing> {
  return api.get(`/api/marketplace/listings/${id}`);
}

// Seller
export async function getMyListings(): Promise<Listing[]> { return api.get("/api/marketplace/my-listings"); }
export async function createListing(input: ListingInput): Promise<Listing> { return api.post("/api/marketplace/listings", input); }
export async function updateListing(id: string, input: ListingInput): Promise<Listing> { return api.put(`/api/marketplace/listings/${id}`, input); }
export async function deleteListing(id: string): Promise<void> { await api.delete(`/api/marketplace/listings/${id}`); }
export async function getSellerDashboard(): Promise<SellerDashboard> { return api.get("/api/marketplace/seller/dashboard"); }

// Purchase
export async function createCheckout(listingId: string): Promise<{ url: string }> {
  return api.post("/api/marketplace/checkout", { listing_id: listingId });
}
export async function getMyPurchases(): Promise<(Purchase & { listing?: Listing })[]> {
  return api.get("/api/marketplace/purchases");
}

// Reviews
export async function getReviews(listingId: string): Promise<Review[]> {
  return api.get(`/api/marketplace/listings/${listingId}/reviews`);
}
export async function createReview(listingId: string, input: ReviewInput): Promise<Review> {
  return api.post(`/api/marketplace/listings/${listingId}/reviews`, input);
}
export async function updateReview(id: string, input: ReviewInput): Promise<Review> {
  return api.put(`/api/marketplace/reviews/${id}`, input);
}
export async function deleteReview(id: string): Promise<void> { await api.delete(`/api/marketplace/reviews/${id}`); }
```

## Page Layout

```
app/(app)/marketplace/page.tsx — Browse listings (buyer view)
app/(app)/marketplace/[id]/page.tsx — Listing detail + reviews
app/(app)/marketplace/my-listings/page.tsx — Seller's listings
app/(app)/marketplace/purchases/page.tsx — Buyer's purchased items
app/(app)/marketplace/dashboard/page.tsx — Seller analytics
```

### Browse Page

```
┌────────────────────────────────────────────────────────────────┐
│ Marketplace                          [My Listings] [Purchases] │
├────────────────────────────────────────────────────────────────┤
│ [Search...          ] [Language ▼] [Price ▼] [Sort: Popular ▼]│
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│ │ React Auth   │ │ Go REST API  │ │ Python ML    │           │
│ │ Hook         │ │ Template     │ │ Pipeline     │           │
│ │              │ │              │ │              │           │
│ │ ★★★★☆ (12)  │ │ ★★★★★ (8)   │ │ ★★★★☆ (5)   │           │
│ │ @alice       │ │ @bob         │ │ @charlie     │           │
│ │ $4.99        │ │ Free         │ │ $9.99        │           │
│ │              │ │              │ │              │           │
│ │ [Preview]    │ │ [Get Free]   │ │ [Buy]        │           │
│ └──────────────┘ └──────────────┘ └──────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

### Listing Detail

```
┌────────────────────────────────────────────────────────────────┐
│ [← Back]  React Auth Hook                           $4.99     │
│ by @alice │ ★★★★☆ (12 reviews) │ 234 downloads               │
├────────────────────────────────────────────────────────────────┤
│ Description:                                                   │
│ A production-ready authentication hook for React with...       │
├────────────────────────────────────────────────────────────────┤
│ Preview:                                                       │
│ ┌────────────────────────────────────────────────────────┐    │
│ │ // Preview — purchase to see full implementation       │    │
│ │ export function useAuth() {                            │    │
│ │   // ... (20 more lines hidden)                        │    │
│ │ }                                                      │    │
│ └────────────────────────────────────────────────────────┘    │
│                                           [Buy for $4.99]      │
│ ─── or after purchase: ───                                     │
│ ┌────────────────────────────────────────────────────────┐    │
│ │ // Full code revealed!                          [Copy] │    │
│ │ export function useAuth() {                            │    │
│ │   const [user, setUser] = useState(null);              │    │
│ │   ...full implementation...                            │    │
│ │ }                                                      │    │
│ └────────────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────────┤
│ Reviews (12)                                                   │
│ ★★★★★ — "Saved me hours of work!" — @dev_user, 2 days ago    │
│ ★★★★☆ — "Good but needs TypeScript fix" — @ts_fan, 1 week ago│
│ [Write a Review] (only if purchased)                           │
└────────────────────────────────────────────────────────────────┘
```

## Navigation

```ts
import { Store } from "lucide-react";

{
  title: "Marketplace",
  href: "/marketplace",
  icon: Store,
  children: [
    { title: "Browse", href: "/marketplace", icon: Search },
    { title: "My Listings", href: "/marketplace/my-listings", icon: Package },
    { title: "Purchases", href: "/marketplace/purchases", icon: ShoppingBag },
  ]
}
```

## npm Packages

```bash
npm install @stripe/stripe-js
```

## Logic Notes

### Stripe Checkout Flow

```
1. Buyer clicks "Buy" on listing
2. Frontend calls POST /api/marketplace/checkout { listing_id }
3. Backend:
   a. Verify listing exists, is published, not already purchased
   b. Create Stripe Checkout Session:
      - line_items: [{ price_data: { currency, unit_amount: price_cents, product_data: { name: title } }, quantity: 1 }]
      - mode: "payment"
      - success_url: FRONTEND_URL/marketplace/{listing_id}?success=true
      - cancel_url: FRONTEND_URL/marketplace/{listing_id}?cancelled=true
      - metadata: { listing_id, buyer_id, purchase_id }
   c. Save purchase record with status="pending" and stripe_session_id
   d. Return { url: session.URL }
4. Frontend redirects to Stripe Checkout
5. On success, Stripe calls webhook:
   POST /api/marketplace/webhook
   Event: checkout.session.completed
6. Backend webhook handler:
   a. Verify signature with STRIPE_WEBHOOK_SECRET
   b. Extract metadata (listing_id, buyer_id, purchase_id)
   c. Update purchase: status="completed", purchased_at=now()
   d. Increment listing.download_count
   e. Update seller_profiles: total_sales++, total_revenue_cents += amount
7. Buyer returns to listing page → full_code is now visible
```

### Access Control

- `full_code` is NEVER sent to frontend unless:
  - Current user is the seller (seller_id == userID)
  - Current user has a completed purchase for this listing
- Backend enforces this in the `GetListing` handler

### Free Listings

If `price_cents == 0`, skip Stripe entirely:
1. Create purchase with `status=completed` immediately
2. No Stripe session needed
3. Increment download_count

### Star Rating Display

```ts
function formatRating(avg: number): string {
  return "★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
}

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
```

### Review Rules

- Only buyers with completed purchases can leave reviews
- One review per buyer per listing (UNIQUE constraint)
- Reviews can be edited/deleted by the reviewer
- Average rating is computed by the backend query (JOIN + AVG)
