package models

import (
	"time"

	"github.com/google/uuid"
)

type VaultAuditLog struct {
	ID          uuid.UUID `json:"id"`
	VaultID     uuid.UUID `json:"vault_id"`
	UserID      uuid.UUID `json:"user_id"`
	Action      string    `json:"action"`
	Details     string    `json:"details"`
	IPAddress   string    `json:"ip_address"`
	UserEmail   string    `json:"user_email,omitempty"`
	DisplayName string    `json:"display_name,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type DailyCountStat struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type FeatureUsageStat struct {
	Feature string `json:"feature"`
	Count   int    `json:"count"`
}

type SystemStats struct {
	TotalUsers      int                `json:"total_users"`
	ActiveUsers     int                `json:"active_users"`
	TotalSnippets   int                `json:"total_snippets"`
	TotalExpenses   int                `json:"total_expenses"`
	TotalHabits     int                `json:"total_habits"`
	TotalBoards     int                `json:"total_boards"`
	TotalVaults     int                `json:"total_vaults"`
	TotalChallenges int                `json:"total_challenges"`
	TotalSessions   int                `json:"total_sessions"`
	UserGrowth      []DailyCountStat   `json:"user_growth"`
	FeatureUsage    []FeatureUsageStat `json:"feature_usage"`
}
