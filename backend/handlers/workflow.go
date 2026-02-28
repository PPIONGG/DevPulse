package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/engine"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type WorkflowHandler struct {
	repo   *repository.WorkflowRepo
	engine *engine.WorkflowEngine
}

func NewWorkflowHandler(repo *repository.WorkflowRepo, eng *engine.WorkflowEngine) *WorkflowHandler {
	return &WorkflowHandler{repo: repo, engine: eng}
}

func (h *WorkflowHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	workflows, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch workflows")
		return
	}
	helpers.JSON(w, http.StatusOK, workflows)
}

func (h *WorkflowHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}
	workflow, err := h.repo.GetByID(r.Context(), userID, id)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "workflow not found")
		return
	}
	helpers.JSON(w, http.StatusOK, workflow)
}

func (h *WorkflowHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.WorkflowInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.TriggerType == "" {
		input.TriggerType = "manual"
	}
	workflow, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create workflow")
		return
	}
	helpers.JSON(w, http.StatusCreated, workflow)
}

func (h *WorkflowHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}
	var input models.WorkflowInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.TriggerType == "" {
		input.TriggerType = "manual"
	}
	workflow, err := h.repo.Update(r.Context(), userID, id, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update workflow")
		return
	}
	helpers.JSON(w, http.StatusOK, workflow)
}

func (h *WorkflowHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}
	if err := h.repo.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "workflow not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete workflow")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *WorkflowHandler) Toggle(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}
	workflow, err := h.repo.Toggle(r.Context(), userID, id)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to toggle workflow")
		return
	}
	helpers.JSON(w, http.StatusOK, workflow)
}

func (h *WorkflowHandler) RunManual(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}
	workflow, err := h.repo.GetByID(r.Context(), userID, id)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "workflow not found")
		return
	}

	run, err := h.engine.Execute(r.Context(), userID, workflow, "manual")
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to execute workflow")
		return
	}
	helpers.JSON(w, http.StatusOK, run)
}

func (h *WorkflowHandler) ListRuns(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}

	// Verify ownership
	userID := helpers.UserIDFromContext(r.Context())
	if _, err := h.repo.GetByID(r.Context(), userID, id); err != nil {
		helpers.Error(w, http.StatusNotFound, "workflow not found")
		return
	}

	runs, err := h.repo.ListRuns(r.Context(), id)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch runs")
		return
	}
	helpers.JSON(w, http.StatusOK, runs)
}

func (h *WorkflowHandler) GetRun(w http.ResponseWriter, r *http.Request) {
	runID, err := uuid.Parse(r.PathValue("runId"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid run ID")
		return
	}
	run, err := h.repo.GetRun(r.Context(), runID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "run not found")
		return
	}

	// Verify ownership
	userID := helpers.UserIDFromContext(r.Context())
	if run.UserID != userID {
		helpers.Error(w, http.StatusNotFound, "run not found")
		return
	}

	helpers.JSON(w, http.StatusOK, run)
}

func (h *WorkflowHandler) GetStepLogs(w http.ResponseWriter, r *http.Request) {
	runID, err := uuid.Parse(r.PathValue("runId"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid run ID")
		return
	}

	// Verify ownership via run
	run, err := h.repo.GetRun(r.Context(), runID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "run not found")
		return
	}
	userID := helpers.UserIDFromContext(r.Context())
	if run.UserID != userID {
		helpers.Error(w, http.StatusNotFound, "run not found")
		return
	}

	logs, err := h.repo.ListStepLogs(r.Context(), runID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch step logs")
		return
	}
	helpers.JSON(w, http.StatusOK, logs)
}

func (h *WorkflowHandler) WebhookTrigger(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("token")
	if token == "" {
		helpers.Error(w, http.StatusBadRequest, "invalid webhook token")
		return
	}

	workflow, err := h.repo.FindByWebhookToken(r.Context(), token)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "webhook not found or workflow disabled")
		return
	}

	run, err := h.engine.Execute(r.Context(), workflow.UserID, workflow, "webhook")
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to execute workflow")
		return
	}
	helpers.JSON(w, http.StatusOK, run)
}
