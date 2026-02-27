package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type CalculationHandler struct {
	repo *repository.CalculationRepo
}

func NewCalculationHandler(repo *repository.CalculationRepo) *CalculationHandler {
	return &CalculationHandler{repo: repo}
}

func (h *CalculationHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	calculations, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch calculations")
		return
	}
	helpers.JSON(w, http.StatusOK, calculations)
}

func (h *CalculationHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.CalculationInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Expression == "" || input.Result == "" {
		helpers.Error(w, http.StatusBadRequest, "expression and result are required")
		return
	}
	calculation, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create calculation")
		return
	}
	helpers.JSON(w, http.StatusCreated, calculation)
}

func (h *CalculationHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid calculation ID")
		return
	}
	if err := h.repo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "calculation not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete calculation")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *CalculationHandler) ClearAll(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	if err := h.repo.DeleteAllByUser(r.Context(), userID); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to clear calculations")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "cleared"})
}
