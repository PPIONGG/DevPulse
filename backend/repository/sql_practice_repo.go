package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type SqlPracticeRepo struct {
	pool *pgxpool.Pool
}

func NewSqlPracticeRepo(pool *pgxpool.Pool) *SqlPracticeRepo {
	return &SqlPracticeRepo{pool: pool}
}

func (r *SqlPracticeRepo) ListChallenges(ctx context.Context) ([]models.SqlChallenge, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, slug, title, difficulty, category, description, table_schema, seed_data, hint, order_sensitive, sort_order, created_at
		 FROM sql_challenges ORDER BY sort_order`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var challenges []models.SqlChallenge
	for rows.Next() {
		var c models.SqlChallenge
		if err := rows.Scan(&c.ID, &c.Slug, &c.Title, &c.Difficulty, &c.Category, &c.Description, &c.TableSchema, &c.SeedData, &c.Hint, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt); err != nil {
			return nil, err
		}
		challenges = append(challenges, c)
	}
	if challenges == nil {
		challenges = []models.SqlChallenge{}
	}
	return challenges, rows.Err()
}

func (r *SqlPracticeRepo) GetBySlug(ctx context.Context, slug string) (*models.SqlChallenge, error) {
	var c models.SqlChallenge
	err := r.pool.QueryRow(ctx,
		`SELECT id, slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order, created_at
		 FROM sql_challenges WHERE slug = $1`, slug,
	).Scan(&c.ID, &c.Slug, &c.Title, &c.Difficulty, &c.Category, &c.Description, &c.TableSchema, &c.SeedData, &c.SolutionSQL, &c.Hint, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SqlPracticeRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.SqlChallenge, error) {
	var c models.SqlChallenge
	err := r.pool.QueryRow(ctx,
		`SELECT id, slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order, created_at
		 FROM sql_challenges WHERE id = $1`, id,
	).Scan(&c.ID, &c.Slug, &c.Title, &c.Difficulty, &c.Category, &c.Description, &c.TableSchema, &c.SeedData, &c.SolutionSQL, &c.Hint, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SqlPracticeRepo) GetProgress(ctx context.Context, userID uuid.UUID) ([]models.SqlChallengeProgress, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT user_id, challenge_id, is_solved, best_time_ms, attempts, first_solved_at, last_attempted_at
		 FROM sql_challenge_progress WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var progress []models.SqlChallengeProgress
	for rows.Next() {
		var p models.SqlChallengeProgress
		if err := rows.Scan(&p.UserID, &p.ChallengeID, &p.IsSolved, &p.BestTimeMs, &p.Attempts, &p.FirstSolvedAt, &p.LastAttemptedAt); err != nil {
			return nil, err
		}
		progress = append(progress, p)
	}
	if progress == nil {
		progress = []models.SqlChallengeProgress{}
	}
	return progress, rows.Err()
}

func (r *SqlPracticeRepo) UpsertProgress(ctx context.Context, userID, challengeID uuid.UUID, isSolved bool, timeMs int) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO sql_challenge_progress (user_id, challenge_id, is_solved, best_time_ms, attempts, first_solved_at, last_attempted_at)
		 VALUES ($1, $2, $3, $4, 1, CASE WHEN $3 THEN $5 ELSE NULL END, $5)
		 ON CONFLICT (user_id, challenge_id) DO UPDATE SET
		   is_solved = sql_challenge_progress.is_solved OR EXCLUDED.is_solved,
		   best_time_ms = CASE
		     WHEN EXCLUDED.is_solved AND (sql_challenge_progress.best_time_ms IS NULL OR EXCLUDED.best_time_ms < sql_challenge_progress.best_time_ms)
		     THEN EXCLUDED.best_time_ms
		     ELSE sql_challenge_progress.best_time_ms
		   END,
		   attempts = sql_challenge_progress.attempts + 1,
		   first_solved_at = COALESCE(sql_challenge_progress.first_solved_at, CASE WHEN EXCLUDED.is_solved THEN $5 ELSE NULL END),
		   last_attempted_at = $5`,
		userID, challengeID, isSolved, timeMs, now,
	)
	return err
}

func (r *SqlPracticeRepo) CreateSubmission(ctx context.Context, userID uuid.UUID, sub models.SqlSubmission) (*models.SqlSubmission, error) {
	var s models.SqlSubmission
	err := r.pool.QueryRow(ctx,
		`INSERT INTO sql_submissions (user_id, challenge_id, query, status, execution_time_ms, error_message)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_id, challenge_id, query, status, execution_time_ms, error_message, submitted_at`,
		userID, sub.ChallengeID, sub.Query, sub.Status, sub.ExecutionTimeMs, sub.ErrorMessage,
	).Scan(&s.ID, &s.UserID, &s.ChallengeID, &s.Query, &s.Status, &s.ExecutionTimeMs, &s.ErrorMessage, &s.SubmittedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SqlPracticeRepo) GetStats(ctx context.Context, userID uuid.UUID) (*models.SqlPracticeStats, error) {
	var stats models.SqlPracticeStats

	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM sql_challenges`).Scan(&stats.TotalChallenges)
	if err != nil {
		return nil, err
	}

	err = r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM sql_challenge_progress WHERE user_id = $1 AND is_solved = true`, userID,
	).Scan(&stats.Solved)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx,
		`SELECT c.difficulty, COUNT(*) AS total,
		        COUNT(p.challenge_id) FILTER (WHERE p.is_solved = true) AS solved
		 FROM sql_challenges c
		 LEFT JOIN sql_challenge_progress p ON c.id = p.challenge_id AND p.user_id = $1
		 GROUP BY c.difficulty`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var diff string
		var total, solved int
		if err := rows.Scan(&diff, &total, &solved); err != nil {
			return nil, err
		}
		switch diff {
		case "easy":
			stats.EasyTotal = total
			stats.EasySolved = solved
		case "medium":
			stats.MediumTotal = total
			stats.MediumSolved = solved
		case "hard":
			stats.HardTotal = total
			stats.HardSolved = solved
		}
	}

	return &stats, rows.Err()
}

func (r *SqlPracticeRepo) ListSubmissions(ctx context.Context, userID, challengeID uuid.UUID, limit int) ([]models.SqlSubmission, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, challenge_id, query, status, execution_time_ms, error_message, submitted_at
		 FROM sql_submissions
		 WHERE user_id = $1 AND challenge_id = $2
		 ORDER BY submitted_at DESC
		 LIMIT $3`, userID, challengeID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []models.SqlSubmission
	for rows.Next() {
		var s models.SqlSubmission
		if err := rows.Scan(&s.ID, &s.UserID, &s.ChallengeID, &s.Query, &s.Status, &s.ExecutionTimeMs, &s.ErrorMessage, &s.SubmittedAt); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	if subs == nil {
		subs = []models.SqlSubmission{}
	}
	return subs, rows.Err()
}
