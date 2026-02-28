package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type HabitRepo struct {
	pool *pgxpool.Pool
}

func NewHabitRepo(pool *pgxpool.Pool) *HabitRepo {
	return &HabitRepo{pool: pool}
}

const habitColumns = `id, user_id, title, description, color, frequency, target_days, is_archived, created_at, updated_at`

func scanHabit(scanner interface{ Scan(dest ...any) error }, h *models.Habit) error {
	return scanner.Scan(&h.ID, &h.UserID, &h.Title, &h.Description, &h.Color, &h.Frequency, &h.TargetDays, &h.IsArchived, &h.CreatedAt, &h.UpdatedAt)
}

func (r *HabitRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Habit, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM habits WHERE user_id = $1 ORDER BY created_at ASC`, habitColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var habits []models.Habit
	for rows.Next() {
		var h models.Habit
		if err := scanHabit(rows, &h); err != nil {
			return nil, err
		}
		habits = append(habits, h)
	}
	if habits == nil {
		habits = []models.Habit{}
	}
	return habits, rows.Err()
}

func (r *HabitRepo) Create(ctx context.Context, userID uuid.UUID, input models.HabitInput) (*models.Habit, error) {
	var h models.Habit
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO habits (user_id, title, description, color, frequency, target_days)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING %s`, habitColumns),
		userID, input.Title, input.Description, input.Color, input.Frequency, input.TargetDays,
	).Scan(&h.ID, &h.UserID, &h.Title, &h.Description, &h.Color, &h.Frequency, &h.TargetDays, &h.IsArchived, &h.CreatedAt, &h.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HabitRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.HabitInput) (*models.Habit, error) {
	var h models.Habit
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE habits
		 SET title = $3, description = $4, color = $5, frequency = $6, target_days = $7, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, habitColumns),
		id, userID, input.Title, input.Description, input.Color, input.Frequency, input.TargetDays,
	).Scan(&h.ID, &h.UserID, &h.Title, &h.Description, &h.Color, &h.Frequency, &h.TargetDays, &h.IsArchived, &h.CreatedAt, &h.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HabitRepo) SetArchived(ctx context.Context, id, userID uuid.UUID, archived bool) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE habits SET is_archived = $3, updated_at = now() WHERE id = $1 AND user_id = $2`,
		id, userID, archived,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *HabitRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM habits WHERE id = $1 AND user_id = $2`,
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

func (r *HabitRepo) CountByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM habits WHERE user_id = $1 AND is_archived = false`, userID).Scan(&count)
	return count, err
}

func (r *HabitRepo) GetTodayStats(ctx context.Context, userID uuid.UUID) (total, completed int, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT 
			COUNT(h.id) as total,
			COUNT(hc.id) as completed
		 FROM habits h
		 LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completed_date = CURRENT_DATE
		 WHERE h.user_id = $1 AND h.is_archived = false`,
		userID,
	).Scan(&total, &completed)
	return
}

func (r *HabitRepo) ListTodayActive(ctx context.Context, userID uuid.UUID) ([]models.Habit, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM habits 
		 WHERE user_id = $1 AND is_archived = false 
		 ORDER BY created_at ASC`, habitColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var habits []models.Habit
	for rows.Next() {
		var h models.Habit
		if err := scanHabit(rows, &h); err != nil {
			return nil, err
		}
		habits = append(habits, h)
	}
	return habits, rows.Err()
}

// --- Completions ---

func (r *HabitRepo) GetCompletions(ctx context.Context, userID uuid.UUID, startDate, endDate string) ([]models.HabitCompletion, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT hc.id, hc.habit_id, hc.completed_date::text, hc.created_at
		 FROM habit_completions hc
		 JOIN habits h ON h.id = hc.habit_id
		 WHERE h.user_id = $1 AND hc.completed_date >= $2::date AND hc.completed_date <= $3::date
		 ORDER BY hc.completed_date ASC`,
		userID, startDate, endDate,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var completions []models.HabitCompletion
	for rows.Next() {
		var c models.HabitCompletion
		if err := rows.Scan(&c.ID, &c.HabitID, &c.CompletedDate, &c.CreatedAt); err != nil {
			return nil, err
		}
		completions = append(completions, c)
	}
	if completions == nil {
		completions = []models.HabitCompletion{}
	}
	return completions, rows.Err()
}

func (r *HabitRepo) ToggleCompletion(ctx context.Context, userID uuid.UUID, habitID uuid.UUID, date string) (bool, error) {
	// Verify habit ownership
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM habits WHERE id = $1 AND user_id = $2)`,
		habitID, userID,
	).Scan(&exists)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, ErrNotFound
	}

	// Try to delete first
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM habit_completions WHERE habit_id = $1 AND completed_date = $2::date`,
		habitID, date,
	)
	if err != nil {
		return false, err
	}
	if tag.RowsAffected() > 0 {
		return false, nil // Was completed, now uncompleted
	}

	// Not found, insert
	_, err = r.pool.Exec(ctx,
		`INSERT INTO habit_completions (habit_id, completed_date) VALUES ($1, $2::date)`,
		habitID, date,
	)
	if err != nil {
		return false, err
	}
	return true, nil // Now completed
}
