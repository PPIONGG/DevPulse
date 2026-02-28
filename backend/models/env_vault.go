package models

import (
	"time"

	"github.com/google/uuid"
)

type EnvVault struct {
	ID          uuid.UUID     `json:"id"`
	UserID      uuid.UUID     `json:"user_id"`
	Name        string        `json:"name"`
	Environment string        `json:"environment"`
	Description string        `json:"description"`
	IsFavorite  bool          `json:"is_favorite"`
	Variables   []EnvVariable `json:"variables"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

type EnvVaultInput struct {
	Name        string `json:"name"`
	Environment string `json:"environment"`
	Description string `json:"description"`
	IsFavorite  bool   `json:"is_favorite"`
}

type EnvVariable struct {
	ID        uuid.UUID `json:"id"`
	VaultID   uuid.UUID `json:"vault_id"`
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	IsSecret  bool      `json:"is_secret"`
	Position  int       `json:"position"`
	CreatedAt time.Time `json:"created_at"`
}

type EnvVariableInput struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	IsSecret bool   `json:"is_secret"`
}

type EnvImportInput struct {
	Raw string `json:"raw"`
}
