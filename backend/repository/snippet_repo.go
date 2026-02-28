package repository

import (
	"context"
	"fmt"
	"time"

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

const snippetColumns = `id, user_id, title, code, language, description, tags, is_public, is_favorite, copied_from, is_verified, verified_by, verified_at, created_at, updated_at`

func scanSnippet(scanner interface{ Scan(dest ...any) error }, s *models.Snippet) error {
	return scanner.Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CopiedFrom, &s.IsVerified, &s.VerifiedBy, &s.VerifiedAt, &s.CreatedAt, &s.UpdatedAt)
}

func (r *SnippetRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Snippet, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM snippets WHERE user_id = $1 ORDER BY updated_at DESC`, snippetColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		if err := scanSnippet(rows, &s); err != nil {
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
		`SELECT s.id, s.user_id, s.title, s.code, s.language, s.description, s.tags, s.is_public, s.is_favorite, s.copied_from, s.is_verified, s.verified_by, s.verified_at, s.created_at, s.updated_at,
		        p.display_name
		 FROM snippets s
		 LEFT JOIN profiles p ON p.id = s.user_id
		 WHERE s.is_public = true AND s.user_id != $1
		 ORDER BY s.updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		if err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CopiedFrom, &s.IsVerified, &s.VerifiedBy, &s.VerifiedAt, &s.CreatedAt, &s.UpdatedAt, &s.OwnerName); err != nil {
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
		fmt.Sprintf(`INSERT INTO snippets (user_id, title, code, language, description, tags, is_public, is_favorite)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING %s`, snippetColumns),
		userID, input.Title, input.Code, input.Language, input.Description, input.Tags, input.IsPublic, input.IsFavorite,
	).Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CopiedFrom, &s.IsVerified, &s.VerifiedBy, &s.VerifiedAt, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SnippetRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.SnippetInput) (*models.Snippet, error) {
	var s models.Snippet
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE snippets
		 SET title = $3, code = $4, language = $5, description = $6, tags = $7, is_public = $8, is_favorite = $9, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, snippetColumns),
		id, userID, input.Title, input.Code, input.Language, input.Description, input.Tags, input.IsPublic, input.IsFavorite,
	).Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CopiedFrom, &s.IsVerified, &s.VerifiedBy, &s.VerifiedAt, &s.CreatedAt, &s.UpdatedAt)
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

func (r *SnippetRepo) CopySnippet(ctx context.Context, sourceID, userID uuid.UUID) (*models.Snippet, error) {
	var s models.Snippet
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO snippets (user_id, title, code, language, description, tags, is_public, is_favorite, copied_from)
		 SELECT $2, title, code, language, description, tags, false, false, id
		 FROM snippets WHERE id = $1 AND is_public = true
		 RETURNING %s`, snippetColumns),
		sourceID, userID,
	).Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CopiedFrom, &s.IsVerified, &s.VerifiedBy, &s.VerifiedAt, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SnippetRepo) GetByID(ctx context.Context, id, userID uuid.UUID) (*models.Snippet, error) {
	var s models.Snippet
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM snippets WHERE id = $1 AND user_id = $2`, snippetColumns),
		id, userID,
	).Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CopiedFrom, &s.IsVerified, &s.VerifiedBy, &s.VerifiedAt, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SnippetRepo) RecentByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.Snippet, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM snippets WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`, snippetColumns),
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		if err := scanSnippet(rows, &s); err != nil {
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

// Admin methods

func (r *SnippetRepo) ListAllPublic(ctx context.Context) ([]models.Snippet, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT s.id, s.user_id, s.title, s.code, s.language, s.description, s.tags, s.is_public, s.is_favorite, s.copied_from, s.is_verified, s.verified_by, s.verified_at, s.created_at, s.updated_at,
		        p.display_name
		 FROM snippets s
		 LEFT JOIN profiles p ON p.id = s.user_id
		 WHERE s.is_public = true
		 ORDER BY s.updated_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		if err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Code, &s.Language, &s.Description, &s.Tags, &s.IsPublic, &s.IsFavorite, &s.CopiedFrom, &s.IsVerified, &s.VerifiedBy, &s.VerifiedAt, &s.CreatedAt, &s.UpdatedAt, &s.OwnerName); err != nil {
			return nil, err
		}
		snippets = append(snippets, s)
	}
	if snippets == nil {
		snippets = []models.Snippet{}
	}
	return snippets, rows.Err()
}

func (r *SnippetRepo) VerifySnippet(ctx context.Context, snippetID, adminID uuid.UUID, verified bool) error {
	if verified {
		now := time.Now()
		_, err := r.pool.Exec(ctx,
			`UPDATE snippets SET is_verified = true, verified_by = $2, verified_at = $3, updated_at = now() WHERE id = $1`,
			snippetID, adminID, now,
		)
		return err
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE snippets SET is_verified = false, verified_by = NULL, verified_at = NULL, updated_at = now() WHERE id = $1`,
		snippetID,
	)
	return err
}

func (r *SnippetRepo) AdminDelete(ctx context.Context, snippetID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM snippets WHERE id = $1`, snippetID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
