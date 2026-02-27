package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type WorkLogRepo struct {
	pool *pgxpool.Pool
}

func NewWorkLogRepo(pool *pgxpool.Pool) *WorkLogRepo {
	return &WorkLogRepo{pool: pool}
}

func (r *WorkLogRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.WorkLog, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, content, date::text, category, hours_spent, created_at, updated_at
		 FROM work_logs WHERE user_id = $1 ORDER BY date DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.WorkLog
	for rows.Next() {
		var w models.WorkLog
		if err := rows.Scan(&w.ID, &w.UserID, &w.Title, &w.Content, &w.Date, &w.Category, &w.HoursSpent, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, w)
	}
	if logs == nil {
		logs = []models.WorkLog{}
	}
	return logs, rows.Err()
}

func (r *WorkLogRepo) Create(ctx context.Context, userID uuid.UUID, input models.WorkLogInput) (*models.WorkLog, error) {
	var w models.WorkLog
	err := r.pool.QueryRow(ctx,
		`INSERT INTO work_logs (user_id, title, content, date, category, hours_spent)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_id, title, content, date::text, category, hours_spent, created_at, updated_at`,
		userID, input.Title, input.Content, input.Date, input.Category, input.HoursSpent,
	).Scan(&w.ID, &w.UserID, &w.Title, &w.Content, &w.Date, &w.Category, &w.HoursSpent, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkLogRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.WorkLogInput) (*models.WorkLog, error) {
	var w models.WorkLog
	err := r.pool.QueryRow(ctx,
		`UPDATE work_logs
		 SET title = $3, content = $4, date = $5, category = $6, hours_spent = $7, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, title, content, date::text, category, hours_spent, created_at, updated_at`,
		id, userID, input.Title, input.Content, input.Date, input.Category, input.HoursSpent,
	).Scan(&w.ID, &w.UserID, &w.Title, &w.Content, &w.Date, &w.Category, &w.HoursSpent, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkLogRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM work_logs WHERE id = $1 AND user_id = $2`,
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

func (r *WorkLogRepo) RecentByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.WorkLog, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, content, date::text, category, hours_spent, created_at, updated_at
		 FROM work_logs WHERE user_id = $1 ORDER BY date DESC LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.WorkLog
	for rows.Next() {
		var w models.WorkLog
		if err := rows.Scan(&w.ID, &w.UserID, &w.Title, &w.Content, &w.Date, &w.Category, &w.HoursSpent, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, w)
	}
	if logs == nil {
		logs = []models.WorkLog{}
	}
	return logs, rows.Err()
}

func (r *WorkLogRepo) CountByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM work_logs WHERE user_id = $1`,
		userID,
	).Scan(&count)
	return count, err
}

func (r *WorkLogRepo) WeeklyHours(ctx context.Context, userID uuid.UUID, weekStart string) (float64, error) {
	var total float64
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(hours_spent), 0) FROM work_logs
		 WHERE user_id = $1 AND date >= $2::date`,
		userID, weekStart,
	).Scan(&total)
	return total, err
}
