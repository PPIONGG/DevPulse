package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type ExpenseHandler struct {
	repo *repository.ExpenseRepo
}

func NewExpenseHandler(repo *repository.ExpenseRepo) *ExpenseHandler {
	return &ExpenseHandler{repo: repo}
}

func (h *ExpenseHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	expenses, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch expenses")
		return
	}
	helpers.JSON(w, http.StatusOK, expenses)
}

func (h *ExpenseHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.ExpenseInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" || input.Amount <= 0 || input.Category == "" || input.Date == "" {
		helpers.Error(w, http.StatusBadRequest, "title, amount (>0), category, and date are required")
		return
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}
	expense, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create expense")
		return
	}
	helpers.JSON(w, http.StatusCreated, expense)
}

func (h *ExpenseHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid expense ID")
		return
	}
	var input models.ExpenseInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" || input.Amount <= 0 || input.Category == "" || input.Date == "" {
		helpers.Error(w, http.StatusBadRequest, "title, amount (>0), category, and date are required")
		return
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}
	expense, err := h.repo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update expense")
		return
	}
	helpers.JSON(w, http.StatusOK, expense)
}

func (h *ExpenseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid expense ID")
		return
	}
	if err := h.repo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "expense not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete expense")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
