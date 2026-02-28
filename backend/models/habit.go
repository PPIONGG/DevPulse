package models

import (
	"time"

	"github.com/google/uuid"
)

type Habit struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Color       string    `json:"color"`
	Frequency   string    `json:"frequency"`
	TargetDays  int       `json:"target_days"`
	IsArchived  bool      `json:"is_archived"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type HabitInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Color       string `json:"color"`
	Frequency   string `json:"frequency"`
	TargetDays  int    `json:"target_days"`
}

type HabitCompletion struct {
	ID            uuid.UUID `json:"id"`
	HabitID       uuid.UUID `json:"habit_id"`
	CompletedDate string    `json:"completed_date"`
	CreatedAt     time.Time `json:"created_at"`
}
