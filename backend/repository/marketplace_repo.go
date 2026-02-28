package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type MarketplaceRepo struct {
	pool *pgxpool.Pool
}

func NewMarketplaceRepo(pool *pgxpool.Pool) *MarketplaceRepo {
	return &MarketplaceRepo{pool: pool}
}

var ErrAlreadyPurchased = errors.New("already purchased")
var ErrCannotPurchaseOwn = errors.New("cannot purchase own listing")
var ErrNotPurchased = errors.New("must purchase before reviewing")

// ListPublished returns all published listings with aggregated rating, review count,
// and whether the given user has purchased each listing.
func (r *MarketplaceRepo) ListPublished(ctx context.Context, userID uuid.UUID, search, language, sort string) ([]models.Listing, error) {
	query := `
		SELECT l.id, l.seller_id, l.title, l.description, l.preview_code, '' AS full_code,
		       l.language, l.tags, l.price_cents, l.currency, l.is_published, l.download_count,
		       COALESCE(p.display_name, '') AS seller_name,
		       COALESCE(avg_r.avg_rating, 0) AS avg_rating,
		       COALESCE(avg_r.review_count, 0) AS review_count,
		       EXISTS(SELECT 1 FROM purchases pu WHERE pu.buyer_id = $1 AND pu.listing_id = l.id AND pu.status = 'completed') AS is_purchased,
		       l.created_at, l.updated_at
		FROM listings l
		LEFT JOIN profiles p ON p.id = l.seller_id
		LEFT JOIN (
			SELECT listing_id, AVG(rating)::float8 AS avg_rating, COUNT(*) AS review_count
			FROM reviews GROUP BY listing_id
		) avg_r ON avg_r.listing_id = l.id
		WHERE l.is_published = true`

	args := []any{userID}
	argIdx := 2

	if search != "" {
		query += fmt.Sprintf(` AND (l.title ILIKE '%%' || $%d || '%%' OR l.description ILIKE '%%' || $%d || '%%')`, argIdx, argIdx)
		args = append(args, search)
		argIdx++
	}

	if language != "" && language != "all" {
		query += fmt.Sprintf(` AND l.language = $%d`, argIdx)
		args = append(args, language)
		argIdx++
	}

	switch sort {
	case "price_asc":
		query += ` ORDER BY l.price_cents ASC, l.created_at DESC`
	case "price_desc":
		query += ` ORDER BY l.price_cents DESC, l.created_at DESC`
	case "rating":
		query += ` ORDER BY avg_rating DESC, review_count DESC, l.created_at DESC`
	case "downloads":
		query += ` ORDER BY l.download_count DESC, l.created_at DESC`
	default:
		query += ` ORDER BY l.created_at DESC`
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var listings []models.Listing
	for rows.Next() {
		var l models.Listing
		if err := rows.Scan(
			&l.ID, &l.SellerID, &l.Title, &l.Description, &l.PreviewCode, &l.FullCode,
			&l.Language, &l.Tags, &l.PriceCents, &l.Currency, &l.IsPublished, &l.DownloadCount,
			&l.SellerName, &l.AvgRating, &l.ReviewCount, &l.IsPurchased,
			&l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			return nil, err
		}
		listings = append(listings, l)
	}
	if listings == nil {
		listings = []models.Listing{}
	}
	return listings, rows.Err()
}

// GetListing returns a single listing. full_code is only returned if the user is the seller or has purchased.
func (r *MarketplaceRepo) GetListing(ctx context.Context, userID, listingID uuid.UUID) (*models.Listing, error) {
	var l models.Listing
	err := r.pool.QueryRow(ctx, `
		SELECT l.id, l.seller_id, l.title, l.description, l.preview_code,
		       CASE WHEN l.seller_id = $1 OR EXISTS(
		           SELECT 1 FROM purchases pu WHERE pu.buyer_id = $1 AND pu.listing_id = l.id AND pu.status = 'completed'
		       ) THEN l.full_code ELSE '' END AS full_code,
		       l.language, l.tags, l.price_cents, l.currency, l.is_published, l.download_count,
		       COALESCE(p.display_name, '') AS seller_name,
		       COALESCE(avg_r.avg_rating, 0) AS avg_rating,
		       COALESCE(avg_r.review_count, 0) AS review_count,
		       EXISTS(SELECT 1 FROM purchases pu WHERE pu.buyer_id = $1 AND pu.listing_id = l.id AND pu.status = 'completed') AS is_purchased,
		       l.created_at, l.updated_at
		FROM listings l
		LEFT JOIN profiles p ON p.id = l.seller_id
		LEFT JOIN (
			SELECT listing_id, AVG(rating)::float8 AS avg_rating, COUNT(*) AS review_count
			FROM reviews GROUP BY listing_id
		) avg_r ON avg_r.listing_id = l.id
		WHERE l.id = $2`,
		userID, listingID,
	).Scan(
		&l.ID, &l.SellerID, &l.Title, &l.Description, &l.PreviewCode, &l.FullCode,
		&l.Language, &l.Tags, &l.PriceCents, &l.Currency, &l.IsPublished, &l.DownloadCount,
		&l.SellerName, &l.AvgRating, &l.ReviewCount, &l.IsPurchased,
		&l.CreatedAt, &l.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &l, nil
}

// ListByUser returns all listings owned by the user (seller's own view).
func (r *MarketplaceRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Listing, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT l.id, l.seller_id, l.title, l.description, l.preview_code, l.full_code,
		       l.language, l.tags, l.price_cents, l.currency, l.is_published, l.download_count,
		       COALESCE(p.display_name, '') AS seller_name,
		       COALESCE(avg_r.avg_rating, 0) AS avg_rating,
		       COALESCE(avg_r.review_count, 0) AS review_count,
		       false AS is_purchased,
		       l.created_at, l.updated_at
		FROM listings l
		LEFT JOIN profiles p ON p.id = l.seller_id
		LEFT JOIN (
			SELECT listing_id, AVG(rating)::float8 AS avg_rating, COUNT(*) AS review_count
			FROM reviews GROUP BY listing_id
		) avg_r ON avg_r.listing_id = l.id
		WHERE l.seller_id = $1
		ORDER BY l.updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var listings []models.Listing
	for rows.Next() {
		var l models.Listing
		if err := rows.Scan(
			&l.ID, &l.SellerID, &l.Title, &l.Description, &l.PreviewCode, &l.FullCode,
			&l.Language, &l.Tags, &l.PriceCents, &l.Currency, &l.IsPublished, &l.DownloadCount,
			&l.SellerName, &l.AvgRating, &l.ReviewCount, &l.IsPurchased,
			&l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			return nil, err
		}
		listings = append(listings, l)
	}
	if listings == nil {
		listings = []models.Listing{}
	}
	return listings, rows.Err()
}

const listingColumns = `id, seller_id, title, description, preview_code, full_code, language, tags, price_cents, currency, is_published, download_count, created_at, updated_at`

func (r *MarketplaceRepo) CreateListing(ctx context.Context, userID uuid.UUID, input models.ListingInput) (*models.Listing, error) {
	var l models.Listing
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO listings (seller_id, title, description, preview_code, full_code, language, tags, price_cents, currency, is_published)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING %s`, listingColumns),
		userID, input.Title, input.Description, input.PreviewCode, input.FullCode, input.Language, input.Tags, input.PriceCents, input.Currency, input.IsPublished,
	).Scan(&l.ID, &l.SellerID, &l.Title, &l.Description, &l.PreviewCode, &l.FullCode,
		&l.Language, &l.Tags, &l.PriceCents, &l.Currency, &l.IsPublished, &l.DownloadCount,
		&l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *MarketplaceRepo) UpdateListing(ctx context.Context, id, userID uuid.UUID, input models.ListingInput) (*models.Listing, error) {
	var l models.Listing
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE listings
		 SET title = $3, description = $4, preview_code = $5, full_code = $6, language = $7, tags = $8, price_cents = $9, currency = $10, is_published = $11, updated_at = now()
		 WHERE id = $1 AND seller_id = $2
		 RETURNING %s`, listingColumns),
		id, userID, input.Title, input.Description, input.PreviewCode, input.FullCode, input.Language, input.Tags, input.PriceCents, input.Currency, input.IsPublished,
	).Scan(&l.ID, &l.SellerID, &l.Title, &l.Description, &l.PreviewCode, &l.FullCode,
		&l.Language, &l.Tags, &l.PriceCents, &l.Currency, &l.IsPublished, &l.DownloadCount,
		&l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &l, nil
}

func (r *MarketplaceRepo) DeleteListing(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM listings WHERE id = $1 AND seller_id = $2`,
		id, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// CreatePurchase creates a completed purchase record and increments download count.
func (r *MarketplaceRepo) CreatePurchase(ctx context.Context, buyerID, listingID uuid.UUID) (*models.Purchase, error) {
	// Check listing exists and get price
	var sellerID uuid.UUID
	var priceCents int
	var currency string
	err := r.pool.QueryRow(ctx,
		`SELECT seller_id, price_cents, currency FROM listings WHERE id = $1 AND is_published = true`,
		listingID,
	).Scan(&sellerID, &priceCents, &currency)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	// Cannot purchase own listing
	if sellerID == buyerID {
		return nil, ErrCannotPurchaseOwn
	}

	// Check not already purchased
	var exists bool
	err = r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM purchases WHERE buyer_id = $1 AND listing_id = $2)`,
		buyerID, listingID,
	).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrAlreadyPurchased
	}

	// Create purchase record (simulated as completed)
	var p models.Purchase
	err = r.pool.QueryRow(ctx,
		`INSERT INTO purchases (buyer_id, listing_id, amount_cents, platform_fee_cents, currency, status)
		 VALUES ($1, $2, $3, 0, $4, 'completed')
		 RETURNING id, buyer_id, listing_id, amount_cents, platform_fee_cents, currency, status, purchased_at, created_at`,
		buyerID, listingID, priceCents, currency,
	).Scan(&p.ID, &p.BuyerID, &p.ListingID, &p.AmountCents, &p.PlatformFeeCents, &p.Currency, &p.Status, &p.PurchasedAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Increment download count
	_, err = r.pool.Exec(ctx,
		`UPDATE listings SET download_count = download_count + 1 WHERE id = $1`,
		listingID,
	)
	if err != nil {
		return nil, err
	}

	return &p, nil
}

// ListPurchases returns all purchases for a buyer with listing info.
func (r *MarketplaceRepo) ListPurchases(ctx context.Context, buyerID uuid.UUID) ([]models.Purchase, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pu.id, pu.buyer_id, pu.listing_id, pu.amount_cents, pu.platform_fee_cents, pu.currency, pu.status, pu.purchased_at, pu.created_at,
		       l.title AS listing_title, l.language AS listing_language,
		       COALESCE(p.display_name, '') AS seller_name
		FROM purchases pu
		JOIN listings l ON l.id = pu.listing_id
		LEFT JOIN profiles p ON p.id = l.seller_id
		WHERE pu.buyer_id = $1
		ORDER BY pu.created_at DESC`,
		buyerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var purchases []models.Purchase
	for rows.Next() {
		var p models.Purchase
		if err := rows.Scan(
			&p.ID, &p.BuyerID, &p.ListingID, &p.AmountCents, &p.PlatformFeeCents, &p.Currency, &p.Status, &p.PurchasedAt, &p.CreatedAt,
			&p.ListingTitle, &p.ListingLanguage, &p.SellerName,
		); err != nil {
			return nil, err
		}
		purchases = append(purchases, p)
	}
	if purchases == nil {
		purchases = []models.Purchase{}
	}
	return purchases, rows.Err()
}

// ListReviews returns reviews for a listing with buyer names.
func (r *MarketplaceRepo) ListReviews(ctx context.Context, listingID uuid.UUID) ([]models.Review, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT rv.id, rv.buyer_id, rv.listing_id, rv.rating, rv.comment,
		       COALESCE(p.display_name, '') AS buyer_name,
		       rv.created_at, rv.updated_at
		FROM reviews rv
		LEFT JOIN profiles p ON p.id = rv.buyer_id
		WHERE rv.listing_id = $1
		ORDER BY rv.created_at DESC`,
		listingID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var rv models.Review
		if err := rows.Scan(
			&rv.ID, &rv.BuyerID, &rv.ListingID, &rv.Rating, &rv.Comment,
			&rv.BuyerName, &rv.CreatedAt, &rv.UpdatedAt,
		); err != nil {
			return nil, err
		}
		reviews = append(reviews, rv)
	}
	if reviews == nil {
		reviews = []models.Review{}
	}
	return reviews, rows.Err()
}

// CreateReview creates a review, verifying the buyer has purchased the listing.
func (r *MarketplaceRepo) CreateReview(ctx context.Context, buyerID, listingID uuid.UUID, input models.ReviewInput) (*models.Review, error) {
	// Verify purchase exists
	var purchased bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM purchases WHERE buyer_id = $1 AND listing_id = $2 AND status = 'completed')`,
		buyerID, listingID,
	).Scan(&purchased)
	if err != nil {
		return nil, err
	}
	if !purchased {
		return nil, ErrNotPurchased
	}

	var rv models.Review
	err = r.pool.QueryRow(ctx, `
		INSERT INTO reviews (buyer_id, listing_id, rating, comment)
		VALUES ($1, $2, $3, $4)
		RETURNING id, buyer_id, listing_id, rating, comment, created_at, updated_at`,
		buyerID, listingID, input.Rating, input.Comment,
	).Scan(&rv.ID, &rv.BuyerID, &rv.ListingID, &rv.Rating, &rv.Comment, &rv.CreatedAt, &rv.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Fill buyer name
	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(display_name, '') FROM profiles WHERE id = $1`, buyerID).Scan(&rv.BuyerName)

	return &rv, nil
}

// UpdateReview updates a review owned by the buyer.
func (r *MarketplaceRepo) UpdateReview(ctx context.Context, reviewID, buyerID uuid.UUID, input models.ReviewInput) (*models.Review, error) {
	var rv models.Review
	err := r.pool.QueryRow(ctx, `
		UPDATE reviews SET rating = $3, comment = $4, updated_at = now()
		WHERE id = $1 AND buyer_id = $2
		RETURNING id, buyer_id, listing_id, rating, comment, created_at, updated_at`,
		reviewID, buyerID, input.Rating, input.Comment,
	).Scan(&rv.ID, &rv.BuyerID, &rv.ListingID, &rv.Rating, &rv.Comment, &rv.CreatedAt, &rv.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(display_name, '') FROM profiles WHERE id = $1`, buyerID).Scan(&rv.BuyerName)

	return &rv, nil
}

// DeleteReview deletes a review owned by the buyer.
func (r *MarketplaceRepo) DeleteReview(ctx context.Context, reviewID, buyerID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM reviews WHERE id = $1 AND buyer_id = $2`,
		reviewID, buyerID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// SellerStats returns aggregate stats for a seller.
func (r *MarketplaceRepo) SellerStats(ctx context.Context, userID uuid.UUID) (*models.SellerStats, error) {
	var stats models.SellerStats

	err := r.pool.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(CASE WHEN pu.status = 'completed' THEN 1 ELSE 0 END), 0) AS total_sales,
			COALESCE(SUM(CASE WHEN pu.status = 'completed' THEN pu.amount_cents ELSE 0 END), 0) AS total_revenue
		FROM purchases pu
		JOIN listings l ON l.id = pu.listing_id
		WHERE l.seller_id = $1`,
		userID,
	).Scan(&stats.TotalSales, &stats.TotalRevenue)
	if err != nil {
		return nil, err
	}

	err = r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE is_published = true) AS active_listings,
			COUNT(*) AS total_listings
		FROM listings WHERE seller_id = $1`,
		userID,
	).Scan(&stats.ActiveListings, &stats.TotalListings)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}
