package engine

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type WorkflowEngine struct {
	httpClient *http.Client
	repo       *repository.WorkflowRepo
}

func NewWorkflowEngine(repo *repository.WorkflowRepo) *WorkflowEngine {
	return &WorkflowEngine{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		repo:       repo,
	}
}

// WorkflowNode represents a single node in the workflow
type WorkflowNode struct {
	ID     string          `json:"id"`
	Type   string          `json:"type"`
	Label  string          `json:"label"`
	Config json.RawMessage `json:"config"`
}

// HTTPRequestConfig holds config for http_request nodes
type HTTPRequestConfig struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

// DelayConfig holds config for delay nodes
type DelayConfig struct {
	Seconds int `json:"seconds"`
}

// ConditionConfig holds config for condition nodes
type ConditionConfig struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

// NotifyConfig holds config for notify nodes
type NotifyConfig struct {
	Message string `json:"message"`
}

// Execute runs a workflow and returns the completed run
func (e *WorkflowEngine) Execute(ctx context.Context, userID uuid.UUID, workflow *models.Workflow, triggerType string) (*models.WorkflowRun, error) {
	// Create the run record
	run, err := e.repo.CreateRun(ctx, models.WorkflowRun{
		WorkflowID:  workflow.ID,
		UserID:      userID,
		Status:      "running",
		TriggerType: triggerType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create run: %w", err)
	}

	startTime := time.Now()

	// Parse nodes from workflow JSON
	var nodes []WorkflowNode
	if err := json.Unmarshal(workflow.Nodes, &nodes); err != nil {
		runErr := fmt.Sprintf("failed to parse nodes: %v", err)
		durationMs := int(time.Since(startTime).Milliseconds())
		e.repo.UpdateRun(ctx, run.ID, "failed", runErr, durationMs)
		e.repo.UpdateRunStatus(ctx, workflow.ID, time.Now(), "failed")
		run.Status = "failed"
		run.Error = runErr
		return run, nil
	}

	// Execute each node sequentially
	var lastOutput json.RawMessage
	runStatus := "success"
	runError := ""

	for _, node := range nodes {
		nodeStart := time.Now()

		// Create step log
		stepLog, err := e.repo.CreateStepLog(ctx, models.WorkflowStepLog{
			RunID:    run.ID,
			NodeID:   node.ID,
			NodeType: node.Type,
			Status:   "running",
			InputData: func() json.RawMessage {
				if lastOutput != nil {
					return lastOutput
				}
				return json.RawMessage(`{}`)
			}(),
		})
		if err != nil {
			runStatus = "failed"
			runError = fmt.Sprintf("failed to create step log: %v", err)
			break
		}

		// Execute node
		output, nodeErr := e.executeNode(ctx, node, lastOutput)
		nodeDuration := int(time.Since(nodeStart).Milliseconds())

		if nodeErr != nil {
			e.repo.UpdateStepLog(ctx, stepLog.ID, "failed", nil, nodeErr.Error(), nodeDuration)
			runStatus = "failed"
			runError = fmt.Sprintf("node %s (%s) failed: %v", node.ID, node.Type, nodeErr)
			break
		}

		e.repo.UpdateStepLog(ctx, stepLog.ID, "success", output, "", nodeDuration)
		lastOutput = output
	}

	// Finalize run
	totalDuration := int(time.Since(startTime).Milliseconds())
	e.repo.UpdateRun(ctx, run.ID, runStatus, runError, totalDuration)
	e.repo.UpdateRunStatus(ctx, workflow.ID, time.Now(), runStatus)

	run.Status = runStatus
	run.Error = runError
	return run, nil
}

func (e *WorkflowEngine) executeNode(ctx context.Context, node WorkflowNode, previousOutput json.RawMessage) (json.RawMessage, error) {
	switch node.Type {
	case "http_request":
		return e.executeHTTPRequest(ctx, node.Config)
	case "delay":
		return e.executeDelay(ctx, node.Config)
	case "transform":
		return e.executeTransform(previousOutput)
	case "condition":
		return e.executeCondition(node.Config, previousOutput)
	case "notify":
		return e.executeNotify(node.Config)
	default:
		return nil, fmt.Errorf("unknown node type: %s", node.Type)
	}
}

func (e *WorkflowEngine) executeHTTPRequest(ctx context.Context, config json.RawMessage) (json.RawMessage, error) {
	var cfg HTTPRequestConfig
	if err := json.Unmarshal(config, &cfg); err != nil {
		return nil, fmt.Errorf("invalid http_request config: %w", err)
	}

	if cfg.URL == "" {
		return nil, fmt.Errorf("url is required")
	}
	if cfg.Method == "" {
		cfg.Method = "GET"
	}

	var bodyReader io.Reader
	if cfg.Body != "" {
		bodyReader = bytes.NewBufferString(cfg.Body)
	}

	req, err := http.NewRequestWithContext(ctx, cfg.Method, cfg.URL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	for k, v := range cfg.Headers {
		req.Header.Set(k, v)
	}

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1024*1024)) // 1MB limit
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	output := map[string]interface{}{
		"status":      resp.StatusCode,
		"status_text": resp.Status,
		"body":        string(body),
	}
	result, _ := json.Marshal(output)
	return result, nil
}

func (e *WorkflowEngine) executeDelay(ctx context.Context, config json.RawMessage) (json.RawMessage, error) {
	var cfg DelayConfig
	if err := json.Unmarshal(config, &cfg); err != nil {
		return nil, fmt.Errorf("invalid delay config: %w", err)
	}

	if cfg.Seconds <= 0 {
		cfg.Seconds = 1
	}
	if cfg.Seconds > 30 {
		cfg.Seconds = 30
	}

	select {
	case <-time.After(time.Duration(cfg.Seconds) * time.Second):
		output, _ := json.Marshal(map[string]interface{}{
			"delayed_seconds": cfg.Seconds,
		})
		return output, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (e *WorkflowEngine) executeTransform(previousOutput json.RawMessage) (json.RawMessage, error) {
	// Simplified: pass through previous output
	if previousOutput == nil {
		return json.RawMessage(`{}`), nil
	}
	return previousOutput, nil
}

func (e *WorkflowEngine) executeCondition(config json.RawMessage, previousOutput json.RawMessage) (json.RawMessage, error) {
	var cfg ConditionConfig
	if err := json.Unmarshal(config, &cfg); err != nil {
		return nil, fmt.Errorf("invalid condition config: %w", err)
	}

	// Parse previous output to check field
	var data map[string]interface{}
	if previousOutput != nil {
		json.Unmarshal(previousOutput, &data)
	}
	if data == nil {
		data = make(map[string]interface{})
	}

	fieldValue := fmt.Sprintf("%v", data[cfg.Field])
	passed := false

	switch cfg.Operator {
	case "equals", "eq", "==":
		passed = fieldValue == cfg.Value
	case "not_equals", "neq", "!=":
		passed = fieldValue != cfg.Value
	case "contains":
		passed = strings.Contains(fieldValue, cfg.Value)
	case "not_contains":
		passed = !strings.Contains(fieldValue, cfg.Value)
	default:
		passed = fieldValue == cfg.Value
	}

	output, _ := json.Marshal(map[string]interface{}{
		"field":    cfg.Field,
		"operator": cfg.Operator,
		"value":    cfg.Value,
		"actual":   fieldValue,
		"passed":   passed,
	})

	if !passed {
		return output, fmt.Errorf("condition not met: %s %s %s (actual: %s)", cfg.Field, cfg.Operator, cfg.Value, fieldValue)
	}

	return output, nil
}

func (e *WorkflowEngine) executeNotify(config json.RawMessage) (json.RawMessage, error) {
	var cfg NotifyConfig
	if err := json.Unmarshal(config, &cfg); err != nil {
		return nil, fmt.Errorf("invalid notify config: %w", err)
	}

	// Simplified: log the notification message
	output, _ := json.Marshal(map[string]interface{}{
		"message":   cfg.Message,
		"notified":  true,
		"timestamp": time.Now().Format(time.RFC3339),
	})
	return output, nil
}
