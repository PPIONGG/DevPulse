package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type BookmarkRepo struct {
	pool *pgxpool.Pool
}

func NewBookmarkRepo(pool *pgxpool.Pool) *BookmarkRepo {
	return &BookmarkRepo{pool: pool}
}

func (r *BookmarkRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Bookmark, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, url, description, tags, is_favorite, created_at, updated_at
		 FROM bookmarks WHERE user_id = $1 ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookmarks []models.Bookmark
	for rows.Next() {
		var b models.Bookmark
		if err := rows.Scan(&b.ID, &b.UserID, &b.Title, &b.URL, &b.Description, &b.Tags, &b.IsFavorite, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		bookmarks = append(bookmarks, b)
	}
	if bookmarks == nil {
		bookmarks = []models.Bookmark{}
	}
	return bookmarks, rows.Err()
}

func (r *BookmarkRepo) Create(ctx context.Context, userID uuid.UUID, input models.BookmarkInput) (*models.Bookmark, error) {
	var b models.Bookmark
	err := r.pool.QueryRow(ctx,
		`INSERT INTO bookmarks (user_id, title, url, description, tags, is_favorite)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_id, title, url, description, tags, is_favorite, created_at, updated_at`,
		userID, input.Title, input.URL, input.Description, input.Tags, input.IsFavorite,
	).Scan(&b.ID, &b.UserID, &b.Title, &b.URL, &b.Description, &b.Tags, &b.IsFavorite, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BookmarkRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.BookmarkInput) (*models.Bookmark, error) {
	var b models.Bookmark
	err := r.pool.QueryRow(ctx,
		`UPDATE bookmarks
		 SET title = $3, url = $4, description = $5, tags = $6, is_favorite = $7, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, title, url, description, tags, is_favorite, created_at, updated_at`,
		id, userID, input.Title, input.URL, input.Description, input.Tags, input.IsFavorite,
	).Scan(&b.ID, &b.UserID, &b.Title, &b.URL, &b.Description, &b.Tags, &b.IsFavorite, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BookmarkRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM bookmarks WHERE id = $1 AND user_id = $2`,
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

func (r *BookmarkRepo) CountByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM bookmarks WHERE user_id = $1`,
		userID,
	).Scan(&count)
	return count, err
}
