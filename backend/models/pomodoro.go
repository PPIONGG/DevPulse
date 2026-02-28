package models

import (
	"time"

	"github.com/google/uuid"
)

type PomodoroSession struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	Duration       int       `json:"duration"`
	TargetDuration int       `json:"target_duration"`
	TaskLabel      string    `json:"task_label"`
	CompletedAt    time.Time `json:"completed_at"`
	CreatedAt      time.Time `json:"created_at"`
}

type PomodoroSessionInput struct {
	Duration       int    `json:"duration"`
	TargetDuration int    `json:"target_duration"`
	TaskLabel      string `json:"task_label"`
}

type PomodoroStats struct {
	TodaySessions int     `json:"today_sessions"`
	TodayMinutes  float64 `json:"today_minutes"`
	WeekSessions  int     `json:"week_sessions"`
	WeekMinutes   float64 `json:"week_minutes"`
	TotalSessions int     `json:"total_sessions"`
	CurrentStreak int     `json:"current_streak"`
}
