package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type JsonDocumentHandler struct {
	repo *repository.JsonDocumentRepo
}

func NewJsonDocumentHandler(repo *repository.JsonDocumentRepo) *JsonDocumentHandler {
	return &JsonDocumentHandler{repo: repo}
}

func (h *JsonDocumentHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	docs, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch json documents")
		return
	}
	helpers.JSON(w, http.StatusOK, docs)
}

func (h *JsonDocumentHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.JsonDocumentInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Format == "" {
		input.Format = "json"
	}
	if input.Tags == nil {
		input.Tags = []string{}
	}
	doc, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create json document")
		return
	}
	helpers.JSON(w, http.StatusCreated, doc)
}

func (h *JsonDocumentHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid document ID")
		return
	}
	var input models.JsonDocumentInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Format == "" {
		input.Format = "json"
	}
	if input.Tags == nil {
		input.Tags = []string{}
	}
	doc, err := h.repo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update json document")
		return
	}
	helpers.JSON(w, http.StatusOK, doc)
}

func (h *JsonDocumentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid document ID")
		return
	}
	if err := h.repo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "document not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete json document")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
