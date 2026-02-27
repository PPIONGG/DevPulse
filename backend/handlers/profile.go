package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type ProfileHandler struct {
	profiles   *repository.ProfileRepo
	uploadsDir string
}

func NewProfileHandler(profiles *repository.ProfileRepo, uploadsDir string) *ProfileHandler {
	return &ProfileHandler{profiles: profiles, uploadsDir: uploadsDir}
}

func (h *ProfileHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	profile, err := h.profiles.FindByID(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "profile not found")
		return
	}
	helpers.JSON(w, http.StatusOK, profile)
}

func (h *ProfileHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.ProfileUpdate
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	profile, err := h.profiles.Update(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update profile")
		return
	}
	helpers.JSON(w, http.StatusOK, profile)
}

func (h *ProfileHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())

	r.Body = http.MaxBytesReader(w, r.Body, 5<<20) // 5MB
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		helpers.Error(w, http.StatusBadRequest, "file too large (max 5MB)")
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "avatar file required")
		return
	}
	defer file.Close()

	ct := header.Header.Get("Content-Type")
	var ext string
	switch {
	case strings.HasPrefix(ct, "image/jpeg"):
		ext = ".jpg"
	case strings.HasPrefix(ct, "image/png"):
		ext = ".png"
	case strings.HasPrefix(ct, "image/webp"):
		ext = ".webp"
	default:
		helpers.Error(w, http.StatusBadRequest, "only JPEG, PNG, and WebP are allowed")
		return
	}

	avatarDir := filepath.Join(h.uploadsDir, "avatars")
	os.MkdirAll(avatarDir, 0755)

	filename := userID.String() + ext
	destPath := filepath.Join(avatarDir, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to save avatar")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to save avatar")
		return
	}

	avatarURL := fmt.Sprintf("/uploads/avatars/%s?t=%d", filename, r.URL.Query().Get("t"))
	// Use a proper timestamp
	avatarURL = fmt.Sprintf("/uploads/avatars/%s", filename)

	update := models.ProfileUpdate{AvatarURL: &avatarURL}
	profile, err := h.profiles.Update(r.Context(), userID, update)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update profile")
		return
	}

	helpers.JSON(w, http.StatusOK, profile)
}
