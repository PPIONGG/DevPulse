package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type ArticleRepo struct {
	pool *pgxpool.Pool
}

func NewArticleRepo(pool *pgxpool.Pool) *ArticleRepo {
	return &ArticleRepo{pool: pool}
}

func (r *ArticleRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Article, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, content, tags, is_favorite, created_at, updated_at
		 FROM articles WHERE user_id = $1 ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []models.Article
	for rows.Next() {
		var a models.Article
		if err := rows.Scan(&a.ID, &a.UserID, &a.Title, &a.Content, &a.Tags, &a.IsFavorite, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		articles = append(articles, a)
	}
	if articles == nil {
		articles = []models.Article{}
	}
	return articles, rows.Err()
}

func (r *ArticleRepo) Create(ctx context.Context, userID uuid.UUID, input models.ArticleInput) (*models.Article, error) {
	var a models.Article
	err := r.pool.QueryRow(ctx,
		`INSERT INTO articles (user_id, title, content, tags, is_favorite)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, user_id, title, content, tags, is_favorite, created_at, updated_at`,
		userID, input.Title, input.Content, input.Tags, input.IsFavorite,
	).Scan(&a.ID, &a.UserID, &a.Title, &a.Content, &a.Tags, &a.IsFavorite, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *ArticleRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.ArticleInput) (*models.Article, error) {
	var a models.Article
	err := r.pool.QueryRow(ctx,
		`UPDATE articles
		 SET title = $3, content = $4, tags = $5, is_favorite = $6, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, title, content, tags, is_favorite, created_at, updated_at`,
		id, userID, input.Title, input.Content, input.Tags, input.IsFavorite,
	).Scan(&a.ID, &a.UserID, &a.Title, &a.Content, &a.Tags, &a.IsFavorite, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *ArticleRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM articles WHERE id = $1 AND user_id = $2`,
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

func (r *ArticleRepo) CountByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM articles WHERE user_id = $1`,
		userID,
	).Scan(&count)
	return count, err
}
