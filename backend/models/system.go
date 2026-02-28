package models

import (
	"time"

	"github.com/google/uuid"
)

type SystemSetting struct {
	Key       string     `json:"key"`
	Value     string     `json:"value"`
	UpdatedAt time.Time  `json:"updated_at"`
	UpdatedBy *uuid.UUID `json:"updated_by,omitempty"`
}

type FeatureToggle struct {
	ID              uuid.UUID  `json:"id"`
	ModulePath      string     `json:"module_path"`
	IsEnabled       bool       `json:"is_enabled"`
	DisabledMessage string     `json:"disabled_message"`
	UpdatedAt       time.Time  `json:"updated_at"`
	UpdatedBy       *uuid.UUID `json:"updated_by,omitempty"`
}

type AnnouncementBanner struct {
	Enabled bool   `json:"enabled"`
	Message string `json:"message"`
	Type    string `json:"type"`
}
