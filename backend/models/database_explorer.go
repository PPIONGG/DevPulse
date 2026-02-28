package models

import (
	"time"

	"github.com/google/uuid"
)

type DBConnection struct {
	ID                uuid.UUID  `json:"id"`
	UserID            uuid.UUID  `json:"user_id"`
	Name              string     `json:"name"`
	DBType            string     `json:"db_type"`
	Host              string     `json:"host"`
	Port              int        `json:"port"`
	DatabaseName      string     `json:"database_name"`
	Username          string     `json:"username"`
	PasswordEncrypted string     `json:"-"`
	SSLMode           string     `json:"ssl_mode"`
	IsReadOnly        bool       `json:"is_read_only"`
	Color             string     `json:"color"`
	LastConnectedAt   *time.Time `json:"last_connected_at"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type DBConnectionInput struct {
	Name         string `json:"name"`
	Host         string `json:"host"`
	Port         int    `json:"port"`
	DatabaseName string `json:"database_name"`
	Username     string `json:"username"`
	Password     string `json:"password"`
	SSLMode      string `json:"ssl_mode"`
	IsReadOnly   bool   `json:"is_read_only"`
	Color        string `json:"color"`
}

type TableInfo struct {
	Name        string `json:"name"`
	Schema      string `json:"schema"`
	RowEstimate int64  `json:"row_estimate"`
	SizeBytes   int64  `json:"size_bytes"`
}

type ColumnInfo struct {
	Name         string  `json:"name"`
	DataType     string  `json:"data_type"`
	IsNullable   bool    `json:"is_nullable"`
	IsPrimaryKey bool    `json:"is_primary_key"`
	DefaultValue *string `json:"default_value"`
	OrdinalPos   int     `json:"ordinal_position"`
}

type ForeignKeyInfo struct {
	ColumnName       string `json:"column_name"`
	ForeignTable     string `json:"foreign_table"`
	ForeignColumn    string `json:"foreign_column"`
	ConstraintName   string `json:"constraint_name"`
}

type TableDetail struct {
	Table       TableInfo        `json:"table"`
	Columns     []ColumnInfo     `json:"columns"`
	ForeignKeys []ForeignKeyInfo `json:"foreign_keys"`
}

type QueryRequest struct {
	ConnectionID string `json:"connection_id"`
	Query        string `json:"query"`
	Limit        int    `json:"limit"`
}

type QueryResult struct {
	Columns         []string        `json:"columns"`
	Rows            [][]interface{} `json:"rows"`
	RowCount        int             `json:"row_count"`
	ExecutionTimeMs int             `json:"execution_time_ms"`
	Truncated       bool            `json:"truncated"`
}

type SavedQuery struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"user_id"`
	ConnectionID *uuid.UUID `json:"connection_id"`
	Title        string     `json:"title"`
	Query        string     `json:"query"`
	Description  string     `json:"description"`
	Tags         []string   `json:"tags"`
	IsFavorite   bool       `json:"is_favorite"`
	LastRunAt    *time.Time `json:"last_run_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type SavedQueryInput struct {
	ConnectionID *string  `json:"connection_id"`
	Title        string   `json:"title"`
	Query        string   `json:"query"`
	Description  string   `json:"description"`
	Tags         []string `json:"tags"`
	IsFavorite   bool     `json:"is_favorite"`
}

type QueryHistoryEntry struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	ConnectionID    uuid.UUID `json:"connection_id"`
	Query           string    `json:"query"`
	RowCount        *int      `json:"row_count"`
	ExecutionTimeMs *int      `json:"execution_time_ms"`
	Status          string    `json:"status"`
	ErrorMessage    string    `json:"error_message"`
	CreatedAt       time.Time `json:"created_at"`
}
