package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type HabitHandler struct {
	repo *repository.HabitRepo
}

func NewHabitHandler(repo *repository.HabitRepo) *HabitHandler {
	return &HabitHandler{repo: repo}
}

func (h *HabitHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	habits, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch habits")
		return
	}
	helpers.JSON(w, http.StatusOK, habits)
}

func (h *HabitHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.HabitInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	validFreqs := map[string]bool{"daily": true, "weekdays": true, "weekly": true}
	if !validFreqs[input.Frequency] {
		input.Frequency = "daily"
	}
	if input.Color == "" {
		input.Color = "#3b82f6"
	}
	if input.TargetDays < 1 || input.TargetDays > 7 {
		input.TargetDays = 1
	}
	habit, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create habit")
		return
	}
	helpers.JSON(w, http.StatusCreated, habit)
}

func (h *HabitHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid habit ID")
		return
	}
	var input models.HabitInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	habit, err := h.repo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update habit")
		return
	}
	helpers.JSON(w, http.StatusOK, habit)
}

func (h *HabitHandler) Archive(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid habit ID")
		return
	}
	var body struct {
		IsArchived bool `json:"is_archived"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.repo.SetArchived(r.Context(), id, userID, body.IsArchived); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "habit not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to archive habit")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "updated"})
}

func (h *HabitHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid habit ID")
		return
	}
	if err := h.repo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "habit not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete habit")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *HabitHandler) GetCompletions(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	startDate := r.URL.Query().Get("start")
	endDate := r.URL.Query().Get("end")
	if startDate == "" || endDate == "" {
		helpers.Error(w, http.StatusBadRequest, "start and end query params are required")
		return
	}
	completions, err := h.repo.GetCompletions(r.Context(), userID, startDate, endDate)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch completions")
		return
	}
	helpers.JSON(w, http.StatusOK, completions)
}

func (h *HabitHandler) ToggleCompletion(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid habit ID")
		return
	}
	var body struct {
		Date string `json:"date"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Date == "" {
		helpers.Error(w, http.StatusBadRequest, "date is required")
		return
	}
	completed, err := h.repo.ToggleCompletion(r.Context(), userID, id, body.Date)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "habit not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to toggle completion")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]bool{"completed": completed})
}
