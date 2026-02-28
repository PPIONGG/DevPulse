package models

import (
	"time"

	"github.com/google/uuid"
)

type JsonDocument struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Format      string    `json:"format"`
	Description string    `json:"description"`
	Tags        []string  `json:"tags"`
	IsFavorite  bool      `json:"is_favorite"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type JsonDocumentInput struct {
	Title       string   `json:"title"`
	Content     string   `json:"content"`
	Format      string   `json:"format"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	IsFavorite  bool     `json:"is_favorite"`
}
