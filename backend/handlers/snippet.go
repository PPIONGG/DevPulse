package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type SnippetHandler struct {
	repo *repository.SnippetRepo
}

func NewSnippetHandler(repo *repository.SnippetRepo) *SnippetHandler {
	return &SnippetHandler{repo: repo}
}

func (h *SnippetHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	snippets, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch snippets")
		return
	}
	helpers.JSON(w, http.StatusOK, snippets)
}

func (h *SnippetHandler) ListShared(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	snippets, err := h.repo.ListShared(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch shared snippets")
		return
	}
	helpers.JSON(w, http.StatusOK, snippets)
}

func (h *SnippetHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.SnippetInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Tags == nil {
		input.Tags = []string{}
	}
	snippet, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create snippet")
		return
	}
	helpers.JSON(w, http.StatusCreated, snippet)
}

func (h *SnippetHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid snippet ID")
		return
	}
	var input models.SnippetInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Tags == nil {
		input.Tags = []string{}
	}

	// Enforce: copied snippets cannot be made public
	existing, err := h.repo.GetByID(r.Context(), id, userID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "snippet not found")
		return
	}
	if existing.CopiedFrom != nil {
		input.IsPublic = false
	}

	snippet, err := h.repo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update snippet")
		return
	}
	helpers.JSON(w, http.StatusOK, snippet)
}

func (h *SnippetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid snippet ID")
		return
	}
	if err := h.repo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "snippet not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete snippet")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *SnippetHandler) Copy(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	sourceID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid snippet ID")
		return
	}
	snippet, err := h.repo.CopySnippet(r.Context(), sourceID, userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to copy snippet")
		return
	}
	helpers.JSON(w, http.StatusCreated, snippet)
}
