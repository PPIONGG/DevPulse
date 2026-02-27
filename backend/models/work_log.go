package models

import (
	"time"

	"github.com/google/uuid"
)

type WorkLog struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	Date       string    `json:"date"`
	Category   string    `json:"category"`
	HoursSpent *float64  `json:"hours_spent"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type WorkLogInput struct {
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	Date       string   `json:"date"`
	Category   string   `json:"category"`
	HoursSpent *float64 `json:"hours_spent"`
}
