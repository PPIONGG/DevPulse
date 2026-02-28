package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type JsonDocumentRepo struct {
	pool *pgxpool.Pool
}

func NewJsonDocumentRepo(pool *pgxpool.Pool) *JsonDocumentRepo {
	return &JsonDocumentRepo{pool: pool}
}

const jsonDocumentColumns = `id, user_id, title, content, format, description, tags, is_favorite, created_at, updated_at`

func scanJsonDocument(scanner interface{ Scan(dest ...any) error }, d *models.JsonDocument) error {
	return scanner.Scan(&d.ID, &d.UserID, &d.Title, &d.Content, &d.Format, &d.Description, &d.Tags, &d.IsFavorite, &d.CreatedAt, &d.UpdatedAt)
}

func (r *JsonDocumentRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.JsonDocument, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM json_documents WHERE user_id = $1 ORDER BY updated_at DESC`, jsonDocumentColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []models.JsonDocument
	for rows.Next() {
		var d models.JsonDocument
		if err := scanJsonDocument(rows, &d); err != nil {
			return nil, err
		}
		docs = append(docs, d)
	}
	if docs == nil {
		docs = []models.JsonDocument{}
	}
	return docs, rows.Err()
}

func (r *JsonDocumentRepo) Create(ctx context.Context, userID uuid.UUID, input models.JsonDocumentInput) (*models.JsonDocument, error) {
	var d models.JsonDocument
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO json_documents (user_id, title, content, format, description, tags, is_favorite)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING %s`, jsonDocumentColumns),
		userID, input.Title, input.Content, input.Format, input.Description, input.Tags, input.IsFavorite,
	).Scan(&d.ID, &d.UserID, &d.Title, &d.Content, &d.Format, &d.Description, &d.Tags, &d.IsFavorite, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *JsonDocumentRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.JsonDocumentInput) (*models.JsonDocument, error) {
	var d models.JsonDocument
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE json_documents
		 SET title = $3, content = $4, format = $5, description = $6, tags = $7, is_favorite = $8, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, jsonDocumentColumns),
		id, userID, input.Title, input.Content, input.Format, input.Description, input.Tags, input.IsFavorite,
	).Scan(&d.ID, &d.UserID, &d.Title, &d.Content, &d.Format, &d.Description, &d.Tags, &d.IsFavorite, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *JsonDocumentRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM json_documents WHERE id = $1 AND user_id = $2`,
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
