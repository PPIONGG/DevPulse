package models

import (
	"time"

	"github.com/google/uuid"
)

type Snippet struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Title       string     `json:"title"`
	Code        string     `json:"code"`
	Language    string     `json:"language"`
	Description string     `json:"description"`
	Tags        []string   `json:"tags"`
	IsPublic    bool       `json:"is_public"`
	IsFavorite  bool       `json:"is_favorite"`
	CopiedFrom  *uuid.UUID `json:"copied_from"`
	OwnerName   *string    `json:"owner_name,omitempty"`
	IsVerified  bool       `json:"is_verified"`
	VerifiedBy  *uuid.UUID `json:"verified_by,omitempty"`
	VerifiedAt  *time.Time `json:"verified_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type SnippetInput struct {
	Title       string   `json:"title"`
	Code        string   `json:"code"`
	Language    string   `json:"language"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	IsPublic    bool     `json:"is_public"`
	IsFavorite  bool     `json:"is_favorite"`
}
