package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type WorkflowRepo struct {
	pool *pgxpool.Pool
}

func NewWorkflowRepo(pool *pgxpool.Pool) *WorkflowRepo {
	return &WorkflowRepo{pool: pool}
}

const workflowColumns = `id, user_id, title, description, is_enabled, trigger_type, cron_expression, webhook_token, nodes, edges, last_run_at, last_run_status, run_count, created_at, updated_at`
const workflowRunColumns = `id, workflow_id, user_id, status, trigger_type, started_at, finished_at, duration_ms, error, created_at`
const workflowStepLogColumns = `id, run_id, node_id, node_type, status, input_data, output_data, error, started_at, finished_at, duration_ms`

func scanWorkflow(scanner interface{ Scan(dest ...any) error }, w *models.Workflow) error {
	return scanner.Scan(
		&w.ID, &w.UserID, &w.Title, &w.Description, &w.IsEnabled,
		&w.TriggerType, &w.CronExpression, &w.WebhookToken,
		&w.Nodes, &w.Edges,
		&w.LastRunAt, &w.LastRunStatus, &w.RunCount,
		&w.CreatedAt, &w.UpdatedAt,
	)
}

func scanWorkflowRun(scanner interface{ Scan(dest ...any) error }, r *models.WorkflowRun) error {
	return scanner.Scan(
		&r.ID, &r.WorkflowID, &r.UserID, &r.Status, &r.TriggerType,
		&r.StartedAt, &r.FinishedAt, &r.DurationMs, &r.Error, &r.CreatedAt,
	)
}

func scanWorkflowStepLog(scanner interface{ Scan(dest ...any) error }, s *models.WorkflowStepLog) error {
	return scanner.Scan(
		&s.ID, &s.RunID, &s.NodeID, &s.NodeType, &s.Status,
		&s.InputData, &s.OutputData, &s.Error,
		&s.StartedAt, &s.FinishedAt, &s.DurationMs,
	)
}

func (r *WorkflowRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Workflow, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM workflows WHERE user_id = $1 ORDER BY updated_at DESC`, workflowColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workflows []models.Workflow
	for rows.Next() {
		var w models.Workflow
		if err := scanWorkflow(rows, &w); err != nil {
			return nil, err
		}
		workflows = append(workflows, w)
	}
	if workflows == nil {
		workflows = []models.Workflow{}
	}
	return workflows, rows.Err()
}

func (r *WorkflowRepo) GetByID(ctx context.Context, userID, workflowID uuid.UUID) (*models.Workflow, error) {
	var w models.Workflow
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM workflows WHERE id = $1 AND user_id = $2`, workflowColumns),
		workflowID, userID,
	).Scan(
		&w.ID, &w.UserID, &w.Title, &w.Description, &w.IsEnabled,
		&w.TriggerType, &w.CronExpression, &w.WebhookToken,
		&w.Nodes, &w.Edges,
		&w.LastRunAt, &w.LastRunStatus, &w.RunCount,
		&w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkflowRepo) Create(ctx context.Context, userID uuid.UUID, input models.WorkflowInput) (*models.Workflow, error) {
	nodes := input.Nodes
	if nodes == nil {
		nodes = json.RawMessage(`[]`)
	}
	edges := input.Edges
	if edges == nil {
		edges = json.RawMessage(`[]`)
	}

	var webhookToken *string
	if input.TriggerType == "webhook" {
		token := uuid.New().String()
		webhookToken = &token
	}

	var w models.Workflow
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO workflows (user_id, title, description, is_enabled, trigger_type, cron_expression, webhook_token, nodes, edges)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING %s`, workflowColumns),
		userID, input.Title, input.Description, input.IsEnabled,
		input.TriggerType, input.CronExpression, webhookToken,
		nodes, edges,
	).Scan(
		&w.ID, &w.UserID, &w.Title, &w.Description, &w.IsEnabled,
		&w.TriggerType, &w.CronExpression, &w.WebhookToken,
		&w.Nodes, &w.Edges,
		&w.LastRunAt, &w.LastRunStatus, &w.RunCount,
		&w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkflowRepo) Update(ctx context.Context, userID, workflowID uuid.UUID, input models.WorkflowInput) (*models.Workflow, error) {
	nodes := input.Nodes
	if nodes == nil {
		nodes = json.RawMessage(`[]`)
	}
	edges := input.Edges
	if edges == nil {
		edges = json.RawMessage(`[]`)
	}

	// Get current workflow to check if trigger type changed
	current, err := r.GetByID(ctx, userID, workflowID)
	if err != nil {
		return nil, err
	}

	webhookToken := current.WebhookToken
	if input.TriggerType == "webhook" && webhookToken == nil {
		token := uuid.New().String()
		webhookToken = &token
	} else if input.TriggerType != "webhook" {
		webhookToken = nil
	}

	var w models.Workflow
	err = r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE workflows
		 SET title = $3, description = $4, is_enabled = $5, trigger_type = $6,
		     cron_expression = $7, webhook_token = $8, nodes = $9, edges = $10, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, workflowColumns),
		workflowID, userID, input.Title, input.Description, input.IsEnabled,
		input.TriggerType, input.CronExpression, webhookToken,
		nodes, edges,
	).Scan(
		&w.ID, &w.UserID, &w.Title, &w.Description, &w.IsEnabled,
		&w.TriggerType, &w.CronExpression, &w.WebhookToken,
		&w.Nodes, &w.Edges,
		&w.LastRunAt, &w.LastRunStatus, &w.RunCount,
		&w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkflowRepo) Delete(ctx context.Context, userID, workflowID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM workflows WHERE id = $1 AND user_id = $2`,
		workflowID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *WorkflowRepo) Toggle(ctx context.Context, userID, workflowID uuid.UUID) (*models.Workflow, error) {
	var w models.Workflow
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE workflows
		 SET is_enabled = NOT is_enabled, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, workflowColumns),
		workflowID, userID,
	).Scan(
		&w.ID, &w.UserID, &w.Title, &w.Description, &w.IsEnabled,
		&w.TriggerType, &w.CronExpression, &w.WebhookToken,
		&w.Nodes, &w.Edges,
		&w.LastRunAt, &w.LastRunStatus, &w.RunCount,
		&w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkflowRepo) FindByWebhookToken(ctx context.Context, token string) (*models.Workflow, error) {
	var w models.Workflow
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM workflows WHERE webhook_token = $1 AND is_enabled = true`, workflowColumns),
		token,
	).Scan(
		&w.ID, &w.UserID, &w.Title, &w.Description, &w.IsEnabled,
		&w.TriggerType, &w.CronExpression, &w.WebhookToken,
		&w.Nodes, &w.Edges,
		&w.LastRunAt, &w.LastRunStatus, &w.RunCount,
		&w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkflowRepo) UpdateRunStatus(ctx context.Context, workflowID uuid.UUID, lastRunAt time.Time, lastRunStatus string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE workflows SET last_run_at = $2, last_run_status = $3, run_count = run_count + 1, updated_at = now() WHERE id = $1`,
		workflowID, lastRunAt, lastRunStatus,
	)
	return err
}

// --- Workflow Runs ---

func (r *WorkflowRepo) CreateRun(ctx context.Context, run models.WorkflowRun) (*models.WorkflowRun, error) {
	var created models.WorkflowRun
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO workflow_runs (workflow_id, user_id, status, trigger_type)
		 VALUES ($1, $2, $3, $4)
		 RETURNING %s`, workflowRunColumns),
		run.WorkflowID, run.UserID, run.Status, run.TriggerType,
	).Scan(
		&created.ID, &created.WorkflowID, &created.UserID, &created.Status, &created.TriggerType,
		&created.StartedAt, &created.FinishedAt, &created.DurationMs, &created.Error, &created.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &created, nil
}

func (r *WorkflowRepo) UpdateRun(ctx context.Context, runID uuid.UUID, status string, errorMsg string, durationMs int) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`UPDATE workflow_runs SET status = $2, error = $3, duration_ms = $4, finished_at = $5 WHERE id = $1`,
		runID, status, errorMsg, durationMs, now,
	)
	return err
}

func (r *WorkflowRepo) ListRuns(ctx context.Context, workflowID uuid.UUID) ([]models.WorkflowRun, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM workflow_runs WHERE workflow_id = $1 ORDER BY started_at DESC LIMIT 50`, workflowRunColumns),
		workflowID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var runs []models.WorkflowRun
	for rows.Next() {
		var run models.WorkflowRun
		if err := scanWorkflowRun(rows, &run); err != nil {
			return nil, err
		}
		runs = append(runs, run)
	}
	if runs == nil {
		runs = []models.WorkflowRun{}
	}
	return runs, rows.Err()
}

func (r *WorkflowRepo) GetRun(ctx context.Context, runID uuid.UUID) (*models.WorkflowRun, error) {
	var run models.WorkflowRun
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM workflow_runs WHERE id = $1`, workflowRunColumns),
		runID,
	).Scan(
		&run.ID, &run.WorkflowID, &run.UserID, &run.Status, &run.TriggerType,
		&run.StartedAt, &run.FinishedAt, &run.DurationMs, &run.Error, &run.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &run, nil
}

// --- Step Logs ---

func (r *WorkflowRepo) CreateStepLog(ctx context.Context, log models.WorkflowStepLog) (*models.WorkflowStepLog, error) {
	inputData := log.InputData
	if inputData == nil {
		inputData = json.RawMessage(`{}`)
	}
	outputData := log.OutputData
	if outputData == nil {
		outputData = json.RawMessage(`{}`)
	}

	var created models.WorkflowStepLog
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO workflow_step_logs (run_id, node_id, node_type, status, input_data, output_data, error)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING %s`, workflowStepLogColumns),
		log.RunID, log.NodeID, log.NodeType, log.Status, inputData, outputData, log.Error,
	).Scan(
		&created.ID, &created.RunID, &created.NodeID, &created.NodeType, &created.Status,
		&created.InputData, &created.OutputData, &created.Error,
		&created.StartedAt, &created.FinishedAt, &created.DurationMs,
	)
	if err != nil {
		return nil, err
	}
	return &created, nil
}

func (r *WorkflowRepo) UpdateStepLog(ctx context.Context, stepLogID uuid.UUID, status string, outputData json.RawMessage, errorMsg string, durationMs int) error {
	if outputData == nil {
		outputData = json.RawMessage(`{}`)
	}
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`UPDATE workflow_step_logs SET status = $2, output_data = $3, error = $4, duration_ms = $5, finished_at = $6 WHERE id = $1`,
		stepLogID, status, outputData, errorMsg, durationMs, now,
	)
	return err
}

func (r *WorkflowRepo) ListStepLogs(ctx context.Context, runID uuid.UUID) ([]models.WorkflowStepLog, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM workflow_step_logs WHERE run_id = $1 ORDER BY started_at ASC`, workflowStepLogColumns),
		runID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.WorkflowStepLog
	for rows.Next() {
		var log models.WorkflowStepLog
		if err := scanWorkflowStepLog(rows, &log); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	if logs == nil {
		logs = []models.WorkflowStepLog{}
	}
	return logs, rows.Err()
}
