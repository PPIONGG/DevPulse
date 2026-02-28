package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type EnvVaultHandler struct {
	repo      *repository.EnvVaultRepo
	auditRepo *repository.AuditRepo
}

func NewEnvVaultHandler(repo *repository.EnvVaultRepo, auditRepo *repository.AuditRepo) *EnvVaultHandler {
	return &EnvVaultHandler{repo: repo, auditRepo: auditRepo}
}

func getClientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		return strings.Split(fwd, ",")[0]
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	return r.RemoteAddr
}

func (h *EnvVaultHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	vaults, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch vaults")
		return
	}
	helpers.JSON(w, http.StatusOK, vaults)
}

func (h *EnvVaultHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid vault ID")
		return
	}
	vault, err := h.repo.GetByID(r.Context(), userID, id)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "vault not found")
		return
	}

	// Audit log
	_ = h.auditRepo.LogVaultAccess(r.Context(), id, userID, "view", "Viewed vault details", getClientIP(r))

	helpers.JSON(w, http.StatusOK, vault)
}

func (h *EnvVaultHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.EnvVaultInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Name == "" {
		helpers.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Environment == "" {
		input.Environment = "development"
	}
	vault, err := h.repo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create vault")
		return
	}
	helpers.JSON(w, http.StatusCreated, vault)
}

func (h *EnvVaultHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid vault ID")
		return
	}
	var input models.EnvVaultInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Name == "" {
		helpers.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Environment == "" {
		input.Environment = "development"
	}
	vault, err := h.repo.Update(r.Context(), userID, id, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update vault")
		return
	}
	helpers.JSON(w, http.StatusOK, vault)
}

func (h *EnvVaultHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid vault ID")
		return
	}
	if err := h.repo.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "vault not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete vault")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *EnvVaultHandler) AddVariable(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	vaultID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid vault ID")
		return
	}
	var input models.EnvVariableInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Key == "" {
		helpers.Error(w, http.StatusBadRequest, "key is required")
		return
	}
	variable, err := h.repo.AddVariable(r.Context(), userID, vaultID, input)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "vault not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to add variable")
		return
	}

	_ = h.auditRepo.LogVaultAccess(r.Context(), vaultID, userID, "add_variable", "Added variable: "+input.Key, getClientIP(r))

	helpers.JSON(w, http.StatusCreated, variable)
}

func (h *EnvVaultHandler) UpdateVariable(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	varID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid variable ID")
		return
	}
	var input models.EnvVariableInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Key == "" {
		helpers.Error(w, http.StatusBadRequest, "key is required")
		return
	}
	variable, err := h.repo.UpdateVariable(r.Context(), userID, varID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update variable")
		return
	}

	_ = h.auditRepo.LogVaultAccess(r.Context(), variable.VaultID, userID, "update_variable", "Updated variable: "+input.Key, getClientIP(r))

	helpers.JSON(w, http.StatusOK, variable)
}

func (h *EnvVaultHandler) DeleteVariable(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	varID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid variable ID")
		return
	}
	if err := h.repo.DeleteVariable(r.Context(), userID, varID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "variable not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete variable")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *EnvVaultHandler) Import(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	vaultID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid vault ID")
		return
	}
	var input models.EnvImportInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Raw == "" {
		helpers.Error(w, http.StatusBadRequest, "raw content is required")
		return
	}
	variables, err := h.repo.ImportVariables(r.Context(), userID, vaultID, input.Raw)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "vault not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to import variables")
		return
	}

	_ = h.auditRepo.LogVaultAccess(r.Context(), vaultID, userID, "import", "Imported variables from .env", getClientIP(r))

	helpers.JSON(w, http.StatusOK, variables)
}

func (h *EnvVaultHandler) GetAuditLog(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	vaultID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid vault ID")
		return
	}

	// Verify the user owns the vault
	_, err = h.repo.GetByID(r.Context(), userID, vaultID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "vault not found")
		return
	}

	logs, err := h.auditRepo.ListVaultLogs(r.Context(), vaultID, 50)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch audit log")
		return
	}
	helpers.JSON(w, http.StatusOK, logs)
}
