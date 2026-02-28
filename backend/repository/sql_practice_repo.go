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
		`SELECT id, slug, title, title_th, difficulty, category, description, description_th, table_schema, seed_data, hint, hint_th, order_sensitive, sort_order, created_at
		 FROM sql_challenges ORDER BY sort_order`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var challenges []models.SqlChallenge
	for rows.Next() {
		var c models.SqlChallenge
		if err := rows.Scan(&c.ID, &c.Slug, &c.Title, &c.TitleTH, &c.Difficulty, &c.Category, &c.Description, &c.DescriptionTH, &c.TableSchema, &c.SeedData, &c.Hint, &c.HintTH, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt); err != nil {
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
		`SELECT id, slug, title, title_th, difficulty, category, description, description_th, table_schema, seed_data, solution_sql, hint, hint_th, order_sensitive, sort_order, created_at
		 FROM sql_challenges WHERE slug = $1`, slug,
	).Scan(&c.ID, &c.Slug, &c.Title, &c.TitleTH, &c.Difficulty, &c.Category, &c.Description, &c.DescriptionTH, &c.TableSchema, &c.SeedData, &c.SolutionSQL, &c.Hint, &c.HintTH, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SqlPracticeRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.SqlChallenge, error) {
	var c models.SqlChallenge
	err := r.pool.QueryRow(ctx,
		`SELECT id, slug, title, title_th, difficulty, category, description, description_th, table_schema, seed_data, solution_sql, hint, hint_th, order_sensitive, sort_order, created_at
		 FROM sql_challenges WHERE id = $1`, id,
	).Scan(&c.ID, &c.Slug, &c.Title, &c.TitleTH, &c.Difficulty, &c.Category, &c.Description, &c.DescriptionTH, &c.TableSchema, &c.SeedData, &c.SolutionSQL, &c.Hint, &c.HintTH, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt)
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
	var firstSolvedAt *time.Time
	if isSolved {
		firstSolvedAt = &now
	}
	_, err := r.pool.Exec(ctx,
		`INSERT INTO sql_challenge_progress (user_id, challenge_id, is_solved, best_time_ms, attempts, first_solved_at, last_attempted_at)
		 VALUES ($1, $2, $3, $4, 1, $5, $6)
		 ON CONFLICT (user_id, challenge_id) DO UPDATE SET
		   is_solved = sql_challenge_progress.is_solved OR EXCLUDED.is_solved,
		   best_time_ms = CASE
		     WHEN EXCLUDED.is_solved AND (sql_challenge_progress.best_time_ms IS NULL OR EXCLUDED.best_time_ms < sql_challenge_progress.best_time_ms)
		     THEN EXCLUDED.best_time_ms
		     ELSE sql_challenge_progress.best_time_ms
		   END,
		   attempts = sql_challenge_progress.attempts + 1,
		   first_solved_at = COALESCE(sql_challenge_progress.first_solved_at, EXCLUDED.first_solved_at),
		   last_attempted_at = EXCLUDED.last_attempted_at`,
		userID, challengeID, isSolved, timeMs, firstSolvedAt, now,
	)
	return err
}

func (r *SqlPracticeRepo) CreateSubmission(ctx context.Context, userID uuid.UUID, sub models.SqlSubmission) (*models.SqlSubmission, error) {
	var s models.SqlSubmission
	err := r.pool.QueryRow(ctx,
		`INSERT INTO sql_submissions (user_id, challenge_id, query, status, execution_time_ms, error_message, query_plan)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, user_id, challenge_id, query, status, execution_time_ms, error_message, submitted_at, query_plan`,
		userID, sub.ChallengeID, sub.Query, sub.Status, sub.ExecutionTimeMs, sub.ErrorMessage, sub.QueryPlan,
	).Scan(&s.ID, &s.UserID, &s.ChallengeID, &s.Query, &s.Status, &s.ExecutionTimeMs, &s.ErrorMessage, &s.SubmittedAt, &s.QueryPlan)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SqlPracticeRepo) GetAdjacentSlugs(ctx context.Context, sortOrder int) (prevSlug, nextSlug string, err error) {
	_ = r.pool.QueryRow(ctx,
		`SELECT slug FROM sql_challenges WHERE sort_order < $1 ORDER BY sort_order DESC LIMIT 1`, sortOrder,
	).Scan(&prevSlug)
	_ = r.pool.QueryRow(ctx,
		`SELECT slug FROM sql_challenges WHERE sort_order > $1 ORDER BY sort_order ASC LIMIT 1`, sortOrder,
	).Scan(&nextSlug)
	return prevSlug, nextSlug, nil
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

	// Difficulty breakdown
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
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Category breakdown
	catRows, err := r.pool.Query(ctx,
		`SELECT c.category, COUNT(*) AS total,
		        COUNT(p.challenge_id) FILTER (WHERE p.is_solved = true) AS solved
		 FROM sql_challenges c
		 LEFT JOIN sql_challenge_progress p ON c.id = p.challenge_id AND p.user_id = $1
		 GROUP BY c.category
		 ORDER BY MIN(c.sort_order)`, userID)
	if err != nil {
		return nil, err
	}
	defer catRows.Close()

	for catRows.Next() {
		var cs models.SqlPracticeCategoryStats
		if err := catRows.Scan(&cs.Category, &cs.Total, &cs.Solved); err != nil {
			return nil, err
		}
		stats.Categories = append(stats.Categories, cs)
	}
	if stats.Categories == nil {
		stats.Categories = []models.SqlPracticeCategoryStats{}
	}
	if err := catRows.Err(); err != nil {
		return nil, err
	}

	// Total submissions
	_ = r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM sql_submissions WHERE user_id = $1`, userID,
	).Scan(&stats.TotalSubmissions)

	// Practice streak (consecutive days with submissions)
	streakRows, err := r.pool.Query(ctx,
		`SELECT DISTINCT submitted_at::date AS d
		 FROM sql_submissions WHERE user_id = $1
		 ORDER BY d DESC`, userID)
	if err != nil {
		return &stats, nil
	}
	defer streakRows.Close()

	streak := 0
	var prev time.Time
	for streakRows.Next() {
		var d time.Time
		if err := streakRows.Scan(&d); err != nil {
			break
		}
		if streak == 0 {
			today := time.Now().Truncate(24 * time.Hour)
			if d.Equal(today) || d.Equal(today.AddDate(0, 0, -1)) {
				streak = 1
				prev = d
			} else {
				break
			}
		} else {
			expected := prev.AddDate(0, 0, -1)
			if d.Equal(expected) {
				streak++
				prev = d
			} else {
				break
			}
		}
	}
	stats.PracticeStreak = streak

	return &stats, nil
}

func (r *SqlPracticeRepo) GetTopSolutions(ctx context.Context, challengeID uuid.UUID, limit int) ([]models.SqlTopSolution, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT s.id, s.user_id, COALESCE(p.display_name, ''), COALESCE(p.avatar_url, ''), s.query, COALESCE(s.execution_time_ms, 0), char_length(s.query) as query_length, s.submitted_at
		 FROM sql_submissions s
		 LEFT JOIN profiles p ON s.user_id = p.id
		 WHERE s.challenge_id = $1 AND s.status = 'correct'
		 ORDER BY s.execution_time_ms ASC NULLS LAST, query_length ASC
		 LIMIT $2`, challengeID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var solutions []models.SqlTopSolution
	for rows.Next() {
		var s models.SqlTopSolution
		if err := rows.Scan(&s.ID, &s.UserID, &s.DisplayName, &s.AvatarURL, &s.Query, &s.ExecutionTimeMs, &s.QueryLength, &s.SubmittedAt); err != nil {
			return nil, err
		}
		solutions = append(solutions, s)
	}
	if solutions == nil {
		solutions = []models.SqlTopSolution{}
	}
	return solutions, rows.Err()
}

func (r *SqlPracticeRepo) GetChallengeByDay(ctx context.Context) (*models.SqlChallenge, error) {
	// Simple deterministic selection based on day of year
	dayOfYear := time.Now().YearDay()
	
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM sql_challenges`).Scan(&count)
	if err != nil || count == 0 {
		return nil, err
	}

	offset := dayOfYear % count
	var c models.SqlChallenge
	err = r.pool.QueryRow(ctx,
		`SELECT id, slug, title, title_th, difficulty, category, description, description_th, table_schema, seed_data, hint, hint_th, order_sensitive, sort_order, created_at
		 FROM sql_challenges ORDER BY id OFFSET $1 LIMIT 1`, offset,
	).Scan(&c.ID, &c.Slug, &c.Title, &c.TitleTH, &c.Difficulty, &c.Category, &c.Description, &c.DescriptionTH, &c.TableSchema, &c.SeedData, &c.Hint, &c.HintTH, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt)
	
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SqlPracticeRepo) ListSubmissions(ctx context.Context, userID, challengeID uuid.UUID, limit int) ([]models.SqlSubmission, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, challenge_id, query, status, execution_time_ms, error_message, submitted_at, query_plan
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
		if err := rows.Scan(&s.ID, &s.UserID, &s.ChallengeID, &s.Query, &s.Status, &s.ExecutionTimeMs, &s.ErrorMessage, &s.SubmittedAt, &s.QueryPlan); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	if subs == nil {
		subs = []models.SqlSubmission{}
	}
	return subs, rows.Err()
}

// SQL Academy Repository Methods

func (r *SqlPracticeRepo) ListLessons(ctx context.Context, userID uuid.UUID) ([]models.SqlLesson, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT l.id, l.module_id, l.module_title, l.module_title_th, l.title, l.title_th, l.description, l.description_th, l.content, l.content_th, l.practice_query, l.expected_output_json, l.table_schema, l.seed_data, l.sort_order, l.created_at,
		        COALESCE(p.is_completed, false) as is_completed
		 FROM sql_lessons l
		 LEFT JOIN sql_lesson_progress p ON l.id = p.lesson_id AND p.user_id = $1
		 ORDER BY l.sort_order`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []models.SqlLesson
	for rows.Next() {
		var l models.SqlLesson
		if err := rows.Scan(&l.ID, &l.ModuleID, &l.ModuleTitle, &l.ModuleTitleTH, &l.Title, &l.TitleTH, &l.Description, &l.DescriptionTH, &l.Content, &l.ContentTH, &l.PracticeQuery, &l.ExpectedOutputJSON, &l.TableSchema, &l.SeedData, &l.SortOrder, &l.CreatedAt, &l.IsCompleted); err != nil {
			return nil, err
		}
		lessons = append(lessons, l)
	}
	if lessons == nil {
		lessons = []models.SqlLesson{}
	}
	return lessons, rows.Err()
}

func (r *SqlPracticeRepo) GetLessonByID(ctx context.Context, id string, userID uuid.UUID) (*models.SqlLesson, error) {
	var l models.SqlLesson
	err := r.pool.QueryRow(ctx,
		`SELECT l.id, l.module_id, l.module_title, l.title, l.description, l.content, l.practice_query, l.expected_output_json, l.table_schema, l.seed_data, l.sort_order, l.created_at,
		        COALESCE(p.is_completed, false) as is_completed
		 FROM sql_lessons l
		 LEFT JOIN sql_lesson_progress p ON l.id = p.lesson_id AND p.user_id = $1
		 WHERE l.id = $2`, userID, id,
	).Scan(&l.ID, &l.ModuleID, &l.ModuleTitle, &l.ModuleTitleTH, &l.Title, &l.TitleTH, &l.Description, &l.DescriptionTH, &l.Content, &l.ContentTH, &l.PracticeQuery, &l.ExpectedOutputJSON, &l.TableSchema, &l.SeedData, &l.SortOrder, &l.CreatedAt, &l.IsCompleted)
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *SqlPracticeRepo) UpsertLessonProgress(ctx context.Context, userID uuid.UUID, lessonID string, isCompleted bool) error {
	now := time.Now()
	var completedAt *time.Time
	if isCompleted {
		completedAt = &now
	}

	_, err := r.pool.Exec(ctx,
		`INSERT INTO sql_lesson_progress (user_id, lesson_id, is_completed, completed_at, last_accessed_at)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (user_id, lesson_id) DO UPDATE SET
		   is_completed = sql_lesson_progress.is_completed OR EXCLUDED.is_completed,
		   completed_at = COALESCE(sql_lesson_progress.completed_at, EXCLUDED.completed_at),
		   last_accessed_at = EXCLUDED.last_accessed_at`,
		userID, lessonID, isCompleted, completedAt, now,
	)
	return err
}

// Admin Challenge CRUD

func (r *SqlPracticeRepo) CreateChallenge(ctx context.Context, input models.SqlChallengeInput) (*models.SqlChallenge, error) {
	var c models.SqlChallenge
	err := r.pool.QueryRow(ctx,
		`INSERT INTO sql_challenges (slug, title, title_th, difficulty, category, description, description_th, table_schema, seed_data, solution_sql, hint, hint_th, order_sensitive, sort_order)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		 RETURNING id, slug, title, title_th, difficulty, category, description, description_th, table_schema, seed_data, hint, hint_th, order_sensitive, sort_order, created_at`,
		input.Slug, input.Title, input.TitleTH, input.Difficulty, input.Category, input.Description, input.DescriptionTH, input.TableSchema, input.SeedData, input.SolutionSQL, input.Hint, input.HintTH, input.OrderSensitive, input.SortOrder,
	).Scan(&c.ID, &c.Slug, &c.Title, &c.TitleTH, &c.Difficulty, &c.Category, &c.Description, &c.DescriptionTH, &c.TableSchema, &c.SeedData, &c.Hint, &c.HintTH, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SqlPracticeRepo) UpdateChallenge(ctx context.Context, id uuid.UUID, input models.SqlChallengeInput) (*models.SqlChallenge, error) {
	var c models.SqlChallenge
	err := r.pool.QueryRow(ctx,
		`UPDATE sql_challenges SET slug=$2, title=$3, title_th=$4, difficulty=$5, category=$6, description=$7, description_th=$8, table_schema=$9, seed_data=$10, solution_sql=$11, hint=$12, hint_th=$13, order_sensitive=$14, sort_order=$15
		 WHERE id = $1
		 RETURNING id, slug, title, title_th, difficulty, category, description, description_th, table_schema, seed_data, hint, hint_th, order_sensitive, sort_order, created_at`,
		id, input.Slug, input.Title, input.TitleTH, input.Difficulty, input.Category, input.Description, input.DescriptionTH, input.TableSchema, input.SeedData, input.SolutionSQL, input.Hint, input.HintTH, input.OrderSensitive, input.SortOrder,
	).Scan(&c.ID, &c.Slug, &c.Title, &c.TitleTH, &c.Difficulty, &c.Category, &c.Description, &c.DescriptionTH, &c.TableSchema, &c.SeedData, &c.Hint, &c.HintTH, &c.OrderSensitive, &c.SortOrder, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SqlPracticeRepo) DeleteChallenge(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM sql_challenges WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
