package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type SnippetRepo struct {
	pool *pgxpool.Pool
}

func NewSnippetRepo(pool *pgxpool.Pool) *SnippetRepo {
	return &SnippetRepo{pool: pool}
}

func (r *SnippetRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Snippet, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, code, language, description, tags, is_public, is_favorite, created_at, updated_at
		 FROM snippets WHERE user_id = $1 ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		if err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		snippets = append(snippets, s)
	}
	if snippets == nil {
		snippets = []models.Snippet{}
	}
	return snippets, rows.Err()
}

func (r *SnippetRepo) ListShared(ctx context.Context, userID uuid.UUID) ([]models.Snippet, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, code, language, description, tags, is_public, is_favorite, created_at, updated_at
		 FROM snippets WHERE is_public = true AND user_id != $1 ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		if err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		snippets = append(snippets, s)
	}
	if snippets == nil {
		snippets = []models.Snippet{}
	}
	return snippets, rows.Err()
}

func (r *SnippetRepo) Create(ctx context.Context, userID uuid.UUID, input models.SnippetInput) (*models.Snippet, error) {
	var s models.Snippet
	err := r.pool.QueryRow(ctx,
		`INSERT INTO snippets (user_id, title, code, language, description, tags, is_public, is_favorite)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, user_id, title, code, language, description, tags, is_public, is_favorite, created_at, updated_at`,
		userID, input.Title, input.Code, input.Language, input.Description, input.Tags, input.IsPublic, input.IsFavorite,
	).Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SnippetRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.SnippetInput) (*models.Snippet, error) {
	var s models.Snippet
	err := r.pool.QueryRow(ctx,
		`UPDATE snippets
		 SET title = $3, code = $4, language = $5, description = $6, tags = $7, is_public = $8, is_favorite = $9, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, title, code, language, description, tags, is_public, is_favorite, created_at, updated_at`,
		id, userID, input.Title, input.Code, input.Language, input.Description, input.Tags, input.IsPublic, input.IsFavorite,
	).Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SnippetRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM snippets WHERE id = $1 AND user_id = $2`,
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

func (r *SnippetRepo) RecentByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.Snippet, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, code, language, description, tags, is_public, is_favorite, created_at, updated_at
		 FROM snippets WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		if err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		snippets = append(snippets, s)
	}
	if snippets == nil {
		snippets = []models.Snippet{}
	}
	return snippets, rows.Err()
}

func (r *SnippetRepo) CountByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM snippets WHERE user_id = $1`,
		userID,
	).Scan(&count)
	return count, err
}
