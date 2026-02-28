package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ApiCollection struct {
	ID          uuid.UUID    `json:"id"`
	UserID      uuid.UUID    `json:"user_id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	IsFavorite  bool         `json:"is_favorite"`
	Requests    []ApiRequest `json:"requests"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type ApiCollectionInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	IsFavorite  bool   `json:"is_favorite"`
}

type KeyValuePair struct {
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type ApiRequest struct {
	ID           uuid.UUID        `json:"id"`
	UserID       uuid.UUID        `json:"user_id"`
	CollectionID *uuid.UUID       `json:"collection_id"`
	Title        string           `json:"title"`
	Method       string           `json:"method"`
	URL          string           `json:"url"`
	Headers      json.RawMessage  `json:"headers"`
	QueryParams  json.RawMessage  `json:"query_params"`
	BodyType     string           `json:"body_type"`
	Body         string           `json:"body"`
	EnvVaultID   *uuid.UUID       `json:"env_vault_id"`
	SortOrder    int              `json:"sort_order"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
}

type ApiRequestInput struct {
	CollectionID *uuid.UUID      `json:"collection_id"`
	Title        string          `json:"title"`
	Method       string          `json:"method"`
	URL          string          `json:"url"`
	Headers      json.RawMessage `json:"headers"`
	QueryParams  json.RawMessage `json:"query_params"`
	BodyType     string          `json:"body_type"`
	Body         string          `json:"body"`
	EnvVaultID   *uuid.UUID      `json:"env_vault_id"`
	SortOrder    int             `json:"sort_order"`
}

type ApiRequestHistory struct {
	ID              uuid.UUID       `json:"id"`
	UserID          uuid.UUID       `json:"user_id"`
	RequestID       *uuid.UUID      `json:"request_id"`
	Method          string          `json:"method"`
	URL             string          `json:"url"`
	RequestHeaders  json.RawMessage `json:"request_headers"`
	RequestBody     string          `json:"request_body"`
	ResponseStatus  int             `json:"response_status"`
	ResponseHeaders json.RawMessage `json:"response_headers"`
	ResponseBody    string          `json:"response_body"`
	ResponseSize    int64           `json:"response_size"`
	ResponseTimeMs  int             `json:"response_time_ms"`
	CreatedAt       time.Time       `json:"created_at"`
}

type ApiProxyRequest struct {
	Method      string          `json:"method"`
	URL         string          `json:"url"`
	Headers     json.RawMessage `json:"headers"`
	Body        string          `json:"body"`
	EnvVaultID  *uuid.UUID      `json:"env_vault_id"`
	RequestID   *uuid.UUID      `json:"request_id"`
	TimeoutSecs int             `json:"timeout_secs"`
}

type ApiProxyResponse struct {
	Status     int             `json:"status"`
	StatusText string          `json:"status_text"`
	Headers    json.RawMessage `json:"headers"`
	Body       string          `json:"body"`
	Size       int64           `json:"size"`
	TimeMs     int             `json:"time_ms"`
}
