package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type PomodoroRepo struct {
	pool *pgxpool.Pool
}

func NewPomodoroRepo(pool *pgxpool.Pool) *PomodoroRepo {
	return &PomodoroRepo{pool: pool}
}

func (r *PomodoroRepo) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.PomodoroSession, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, duration, target_duration, task_label, completed_at, created_at
		 FROM pomodoro_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.PomodoroSession
	for rows.Next() {
		var s models.PomodoroSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.Duration, &s.TargetDuration, &s.TaskLabel, &s.CompletedAt, &s.CreatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	if sessions == nil {
		sessions = []models.PomodoroSession{}
	}
	return sessions, rows.Err()
}

func (r *PomodoroRepo) Create(ctx context.Context, userID uuid.UUID, input models.PomodoroSessionInput) (*models.PomodoroSession, error) {
	var s models.PomodoroSession
	err := r.pool.QueryRow(ctx,
		`INSERT INTO pomodoro_sessions (user_id, duration, target_duration, task_label)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, duration, target_duration, task_label, completed_at, created_at`,
		userID, input.Duration, input.TargetDuration, input.TaskLabel,
	).Scan(&s.ID, &s.UserID, &s.Duration, &s.TargetDuration, &s.TaskLabel, &s.CompletedAt, &s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *PomodoroRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM pomodoro_sessions WHERE id = $1 AND user_id = $2`,
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

func (r *PomodoroRepo) ClearAll(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM pomodoro_sessions WHERE user_id = $1`,
		userID,
	)
	return err
}

func (r *PomodoroRepo) GetStats(ctx context.Context, userID uuid.UUID) (*models.PomodoroStats, error) {
	var stats models.PomodoroStats

	// Today + week + total counts
	err := r.pool.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(CASE WHEN completed_at >= CURRENT_DATE THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN completed_at >= CURRENT_DATE THEN duration ELSE 0 END), 0) / 60.0,
			COALESCE(SUM(CASE WHEN completed_at >= date_trunc('week', CURRENT_DATE) THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN completed_at >= date_trunc('week', CURRENT_DATE) THEN duration ELSE 0 END), 0) / 60.0,
			COUNT(*)
		FROM pomodoro_sessions
		WHERE user_id = $1
	`, userID).Scan(
		&stats.TodaySessions,
		&stats.TodayMinutes,
		&stats.WeekSessions,
		&stats.WeekMinutes,
		&stats.TotalSessions,
	)
	if err != nil {
		return nil, err
	}

	// Current streak: consecutive days with at least 1 session, including today
	err = r.pool.QueryRow(ctx, `
		WITH daily AS (
			SELECT DISTINCT DATE(completed_at) as d
			FROM pomodoro_sessions
			WHERE user_id = $1
			ORDER BY d DESC
		),
		streaks AS (
			SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int AS grp
			FROM daily
		)
		SELECT COALESCE(
			(SELECT COUNT(*) FROM streaks WHERE grp = (SELECT grp FROM streaks WHERE d = CURRENT_DATE LIMIT 1)),
			0
		)
	`, userID).Scan(&stats.CurrentStreak)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}
