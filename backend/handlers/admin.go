package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type AdminHandler struct {
	navRepo *repository.NavigationRepo
}

func NewAdminHandler(navRepo *repository.NavigationRepo) *AdminHandler {
	return &AdminHandler{navRepo: navRepo}
}

func (h *AdminHandler) ListNavigation(w http.ResponseWriter, r *http.Request) {
	items, err := h.navRepo.ListAll(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch navigation items")
		return
	}
	helpers.JSON(w, http.StatusOK, items)
}

func (h *AdminHandler) GetVisibleNavigation(w http.ResponseWriter, r *http.Request) {
	role := helpers.UserRoleFromContext(r.Context())
	items, err := h.navRepo.ListVisible(r.Context(), role)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch navigation items")
		return
	}
	helpers.JSON(w, http.StatusOK, items)
}

func (h *AdminHandler) ToggleNavigationVisibility(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid ID")
		return
	}

	var body struct {
		IsHidden bool `json:"is_hidden"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.navRepo.UpdateVisibility(r.Context(), id, body.IsHidden); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update visibility")
		return
	}

	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}
