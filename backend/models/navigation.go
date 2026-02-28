package models

import (
	"time"

	"github.com/google/uuid"
)

type NavigationItem struct {
	ID        uuid.UUID `json:"id"`
	Label     string    `json:"label"`
	Icon      string    `json:"icon"`
	Path      string    `json:"path"`
	IsHidden  bool      `json:"is_hidden"`
	MinRole   string    `json:"min_role"`
	SortOrder int       `json:"sort_order"`
	GroupName string    `json:"group_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type NavigationItemInput struct {
	Label     string `json:"label"`
	Icon      string `json:"icon"`
	Path      string `json:"path"`
	IsHidden  bool   `json:"is_hidden"`
	MinRole   string `json:"min_role"`
	SortOrder int    `json:"sort_order"`
}
