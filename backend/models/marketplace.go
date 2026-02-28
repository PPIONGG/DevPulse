package models

import (
	"time"

	"github.com/google/uuid"
)

type Listing struct {
	ID            uuid.UUID `json:"id"`
	SellerID      uuid.UUID `json:"seller_id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	PreviewCode   string    `json:"preview_code"`
	FullCode      string    `json:"full_code"`
	Language      string    `json:"language"`
	Tags          []string  `json:"tags"`
	PriceCents    int       `json:"price_cents"`
	Currency      string    `json:"currency"`
	IsPublished   bool      `json:"is_published"`
	DownloadCount int       `json:"download_count"`
	SellerName    string    `json:"seller_name"`
	AvgRating     float64   `json:"avg_rating"`
	ReviewCount   int       `json:"review_count"`
	IsPurchased   bool      `json:"is_purchased"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
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
	ID               uuid.UUID  `json:"id"`
	BuyerID          uuid.UUID  `json:"buyer_id"`
	ListingID        uuid.UUID  `json:"listing_id"`
	AmountCents      int        `json:"amount_cents"`
	PlatformFeeCents int        `json:"platform_fee_cents"`
	Currency         string     `json:"currency"`
	Status           string     `json:"status"`
	PurchasedAt      *time.Time `json:"purchased_at"`
	CreatedAt        time.Time  `json:"created_at"`
	ListingTitle     string     `json:"listing_title,omitempty"`
	ListingLanguage  string     `json:"listing_language,omitempty"`
	SellerName       string     `json:"seller_name,omitempty"`
}

type Review struct {
	ID        uuid.UUID `json:"id"`
	BuyerID   uuid.UUID `json:"buyer_id"`
	ListingID uuid.UUID `json:"listing_id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	BuyerName string    `json:"buyer_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ReviewInput struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type SellerStats struct {
	TotalSales     int `json:"total_sales"`
	TotalRevenue   int `json:"total_revenue"`
	ActiveListings int `json:"active_listings"`
	TotalListings  int `json:"total_listings"`
}
