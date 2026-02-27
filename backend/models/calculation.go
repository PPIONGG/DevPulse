package models

import (
	"time"

	"github.com/google/uuid"
)

type Calculation struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	Expression string    `json:"expression"`
	Result     string    `json:"result"`
	CreatedAt  time.Time `json:"created_at"`
}

type CalculationInput struct {
	Expression string `json:"expression"`
	Result     string `json:"result"`
}
