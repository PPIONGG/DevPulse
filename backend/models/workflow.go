package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Workflow struct {
	ID             uuid.UUID       `json:"id"`
	UserID         uuid.UUID       `json:"user_id"`
	Title          string          `json:"title"`
	Description    string          `json:"description"`
	IsEnabled      bool            `json:"is_enabled"`
	TriggerType    string          `json:"trigger_type"`
	CronExpression string          `json:"cron_expression"`
	WebhookToken   *string         `json:"webhook_token"`
	Nodes          json.RawMessage `json:"nodes"`
	Edges          json.RawMessage `json:"edges"`
	LastRunAt      *time.Time      `json:"last_run_at"`
	LastRunStatus  *string         `json:"last_run_status"`
	RunCount       int             `json:"run_count"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type WorkflowInput struct {
	Title          string          `json:"title"`
	Description    string          `json:"description"`
	IsEnabled      bool            `json:"is_enabled"`
	TriggerType    string          `json:"trigger_type"`
	CronExpression string          `json:"cron_expression"`
	Nodes          json.RawMessage `json:"nodes"`
	Edges          json.RawMessage `json:"edges"`
}

type WorkflowRun struct {
	ID          uuid.UUID  `json:"id"`
	WorkflowID  uuid.UUID  `json:"workflow_id"`
	UserID      uuid.UUID  `json:"user_id"`
	Status      string     `json:"status"`
	TriggerType string     `json:"trigger_type"`
	StartedAt   time.Time  `json:"started_at"`
	FinishedAt  *time.Time `json:"finished_at"`
	DurationMs  *int       `json:"duration_ms"`
	Error       string     `json:"error"`
	CreatedAt   time.Time  `json:"created_at"`
}

type WorkflowStepLog struct {
	ID         uuid.UUID       `json:"id"`
	RunID      uuid.UUID       `json:"run_id"`
	NodeID     string          `json:"node_id"`
	NodeType   string          `json:"node_type"`
	Status     string          `json:"status"`
	InputData  json.RawMessage `json:"input_data"`
	OutputData json.RawMessage `json:"output_data"`
	Error      string          `json:"error"`
	StartedAt  time.Time       `json:"started_at"`
	FinishedAt *time.Time      `json:"finished_at"`
	DurationMs *int            `json:"duration_ms"`
}
