package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type PomodoroHandler struct {
	repo *repository.PomodoroRepo
}

func NewPomodoroHandler(repo *repository.PomodoroRepo) *PomodoroHandler {
	return &PomodoroHandler{repo: repo}
}

func (h *PomodoroHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	sessions, err := h.repo.ListByUser(r.Context(), userID, 50)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch pomodoro sessions")
		return
	}
	helpers.JSON(w, http.StatusOK, sessions)
}

func (h *PomodoroHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.PomodoroSessionInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Duration <= 0 || input.TargetDuration <= 0 {
		helpers.Error(w, http.StatusBadRequest, "duration and target_duration must be positive")
		return
	}
	session, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create pomodoro session")
		return
	}
	helpers.JSON(w, http.StatusCreated, session)
}

func (h *PomodoroHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid session ID")
		return
	}
	if err := h.repo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "session not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete session")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *PomodoroHandler) ClearAll(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	if err := h.repo.ClearAll(r.Context(), userID); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to clear pomodoro sessions")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "cleared"})
}

func (h *PomodoroHandler) Stats(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	stats, err := h.repo.GetStats(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch pomodoro stats")
		return
	}
	helpers.JSON(w, http.StatusOK, stats)
}
