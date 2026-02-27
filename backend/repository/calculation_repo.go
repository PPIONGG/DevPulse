package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type CalculationRepo struct {
	pool *pgxpool.Pool
}

func NewCalculationRepo(pool *pgxpool.Pool) *CalculationRepo {
	return &CalculationRepo{pool: pool}
}

func (r *CalculationRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Calculation, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, expression, result, created_at
		 FROM calculations WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var calculations []models.Calculation
	for rows.Next() {
		var c models.Calculation
		if err := rows.Scan(&c.ID, &c.UserID, &c.Expression, &c.Result, &c.CreatedAt); err != nil {
			return nil, err
		}
		calculations = append(calculations, c)
	}
	if calculations == nil {
		calculations = []models.Calculation{}
	}
	return calculations, rows.Err()
}

func (r *CalculationRepo) Create(ctx context.Context, userID uuid.UUID, input models.CalculationInput) (*models.Calculation, error) {
	var c models.Calculation
	err := r.pool.QueryRow(ctx,
		`INSERT INTO calculations (user_id, expression, result)
		 VALUES ($1, $2, $3)
		 RETURNING id, user_id, expression, result, created_at`,
		userID, input.Expression, input.Result,
	).Scan(&c.ID, &c.UserID, &c.Expression, &c.Result, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CalculationRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM calculations WHERE id = $1 AND user_id = $2`,
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

func (r *CalculationRepo) DeleteAllByUser(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM calculations WHERE user_id = $1`,
		userID,
	)
	return err
}
