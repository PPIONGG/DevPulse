package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type BookmarkHandler struct {
	repo *repository.BookmarkRepo
}

func NewBookmarkHandler(repo *repository.BookmarkRepo) *BookmarkHandler {
	return &BookmarkHandler{repo: repo}
}

func (h *BookmarkHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	bookmarks, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch bookmarks")
		return
	}
	helpers.JSON(w, http.StatusOK, bookmarks)
}

func (h *BookmarkHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.BookmarkInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Tags == nil {
		input.Tags = []string{}
	}
	bookmark, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create bookmark")
		return
	}
	helpers.JSON(w, http.StatusCreated, bookmark)
}

func (h *BookmarkHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid bookmark ID")
		return
	}
	var input models.BookmarkInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Tags == nil {
		input.Tags = []string{}
	}
	bookmark, err := h.repo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update bookmark")
		return
	}
	helpers.JSON(w, http.StatusOK, bookmark)
}

func (h *BookmarkHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid bookmark ID")
		return
	}
	if err := h.repo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "bookmark not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete bookmark")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
