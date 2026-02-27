package models

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	Token     string    `json:"-"`
	UserID    uuid.UUID `json:"-"`
	ExpiresAt time.Time `json:"-"`
	CreatedAt time.Time `json:"-"`
}
