package models

import (
	"time"

	"github.com/google/uuid"
)

type Expense struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Title       string    `json:"title"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	Category    string    `json:"category"`
	Date        string    `json:"date"`
	Notes       string    `json:"notes"`
	IsRecurring bool      `json:"is_recurring"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ExpenseInput struct {
	Title       string  `json:"title"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Category    string  `json:"category"`
	Date        string  `json:"date"`
	Notes       string  `json:"notes"`
	IsRecurring bool    `json:"is_recurring"`
}
