package models

import (
	"time"

	"github.com/google/uuid"
)

type SqlChallenge struct {
	ID             uuid.UUID        `json:"id"`
	Slug           string           `json:"slug"`
	Title          string           `json:"title"`
	Difficulty     string           `json:"difficulty"`
	Category       string           `json:"category"`
	Description    string           `json:"description"`
	TableSchema    string           `json:"table_schema"`
	SeedData       string           `json:"seed_data"`
	SolutionSQL    string           `json:"-"`
	Hint           string           `json:"hint"`
	OrderSensitive bool             `json:"order_sensitive"`
	SortOrder      int              `json:"sort_order"`
	CreatedAt      time.Time        `json:"created_at"`
	Metadata       *ChallengeMetadata `json:"metadata,omitempty"`
}

type ColumnMetadata struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type TableMetadata struct {
	Name    string           `json:"name"`
	Columns []ColumnMetadata `json:"columns"`
}

type ChallengeMetadata struct {
	Tables []TableMetadata `json:"tables"`
}

type SqlSubmission struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	ChallengeID     uuid.UUID `json:"challenge_id"`
	Query           string    `json:"query"`
	Status          string    `json:"status"`
	ExecutionTimeMs *int      `json:"execution_time_ms"`
	ErrorMessage    string    `json:"error_message"`
	SubmittedAt     time.Time `json:"submitted_at"`
	QueryPlan       *string   `json:"query_plan,omitempty"`
}

type SqlChallengeProgress struct {
	UserID         uuid.UUID  `json:"user_id"`
	ChallengeID    uuid.UUID  `json:"challenge_id"`
	IsSolved       bool       `json:"is_solved"`
	BestTimeMs     *int       `json:"best_time_ms"`
	Attempts       int        `json:"attempts"`
	FirstSolvedAt  *time.Time `json:"first_solved_at"`
	LastAttemptedAt time.Time `json:"last_attempted_at"`
}

type SqlSubmitRequest struct {
	ChallengeID string `json:"challenge_id"`
	Query       string `json:"query"`
}

type SqlSubmitResult struct {
	Status          string       `json:"status"`
	UserResult      *QueryResult `json:"user_result"`
	ExpectedResult  *QueryResult `json:"expected_result"`
	ExecutionTimeMs int          `json:"execution_time_ms"`
	ErrorMessage    string       `json:"error_message"`
	QueryPlan       string       `json:"query_plan,omitempty"`
}

type SqlTopSolution struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	DisplayName     string    `json:"display_name,omitempty"`
	AvatarURL       string    `json:"avatar_url,omitempty"`
	Query           string    `json:"query"`
	ExecutionTimeMs int       `json:"execution_time_ms"`
	QueryLength     int       `json:"query_length"`
	SubmittedAt     time.Time `json:"submitted_at"`
}

type SqlPracticeCategoryStats struct {
	Category string `json:"category"`
	Total    int    `json:"total"`
	Solved   int    `json:"solved"`
}

type SqlPracticeStats struct {
	TotalChallenges  int                        `json:"total_challenges"`
	Solved           int                        `json:"solved"`
	EasyTotal        int                        `json:"easy_total"`
	EasySolved       int                        `json:"easy_solved"`
	MediumTotal      int                        `json:"medium_total"`
	MediumSolved     int                        `json:"medium_solved"`
	HardTotal        int                        `json:"hard_total"`
	HardSolved       int                        `json:"hard_solved"`
	Categories       []SqlPracticeCategoryStats `json:"categories"`
	PracticeStreak   int                        `json:"practice_streak"`
	TotalSubmissions int                        `json:"total_submissions"`
	DailyChallenge   *SqlChallenge              `json:"daily_challenge,omitempty"`
}

type SqlChallengeDetail struct {
	Challenge   SqlChallenge          `json:"challenge"`
	Submissions []SqlSubmission        `json:"submissions"`
	Progress    *SqlChallengeProgress `json:"progress"`
	PrevSlug    string                `json:"prev_slug"`
	NextSlug    string                `json:"next_slug"`
	SolutionSQL *string               `json:"solution_sql"`
}

// SQL Academy Models

type SqlLesson struct {
	ID                 string    `json:"id"`
	ModuleID           string    `json:"module_id"`
	ModuleTitle        string    `json:"module_title"`
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	Content            string    `json:"content"`
	PracticeQuery      string    `json:"practice_query"`
	ExpectedOutputJSON *string   `json:"expected_output_json"`
	TableSchema        string    `json:"table_schema"`
	SeedData           string    `json:"seed_data"`
	SortOrder          int       `json:"sort_order"`
	CreatedAt          time.Time `json:"created_at"`
	IsCompleted        bool      `json:"is_completed"`
}

type SqlLessonProgress struct {
	UserID         uuid.UUID  `json:"user_id"`
	LessonID       string     `json:"lesson_id"`
	IsCompleted    bool       `json:"is_completed"`
	CompletedAt    *time.Time `json:"completed_at"`
	LastAccessedAt time.Time  `json:"last_accessed_at"`
}

type SqlModuleWithLessons struct {
	ID      string      `json:"id"`
	Title   string      `json:"title"`
	Lessons []SqlLesson `json:"lessons"`
}

type SqlChallengeInput struct {
	Slug           string `json:"slug"`
	Title          string `json:"title"`
	Difficulty     string `json:"difficulty"`
	Category       string `json:"category"`
	Description    string `json:"description"`
	TableSchema    string `json:"table_schema"`
	SeedData       string `json:"seed_data"`
	SolutionSQL    string `json:"solution_sql"`
	Hint           string `json:"hint"`
	OrderSensitive bool   `json:"order_sensitive"`
	SortOrder      int    `json:"sort_order"`
}
