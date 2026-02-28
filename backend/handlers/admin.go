package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type AdminHandler struct {
	navRepo         *repository.NavigationRepo
	userRepo        *repository.UserRepo
	sessionRepo     *repository.SessionRepo
	snippetRepo     *repository.SnippetRepo
	sqlPracticeRepo *repository.SqlPracticeRepo
	statsRepo       *repository.StatsRepo
	auditRepo       *repository.AuditRepo
	systemRepo      *repository.SystemRepo
	pool            *pgxpool.Pool
}

func NewAdminHandler(
	navRepo *repository.NavigationRepo,
	userRepo *repository.UserRepo,
	sessionRepo *repository.SessionRepo,
	snippetRepo *repository.SnippetRepo,
	sqlPracticeRepo *repository.SqlPracticeRepo,
	statsRepo *repository.StatsRepo,
	auditRepo *repository.AuditRepo,
	systemRepo *repository.SystemRepo,
	pool *pgxpool.Pool,
) *AdminHandler {
	return &AdminHandler{
		navRepo:         navRepo,
		userRepo:        userRepo,
		sessionRepo:     sessionRepo,
		snippetRepo:     snippetRepo,
		sqlPracticeRepo: sqlPracticeRepo,
		statsRepo:       statsRepo,
		auditRepo:       auditRepo,
		systemRepo:      systemRepo,
		pool:            pool,
	}
}

// ========== Navigation ==========

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

func (h *AdminHandler) UpdateNavigationGroup(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid ID")
		return
	}

	var body struct {
		GroupName string `json:"group_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.GroupName == "" {
		helpers.Error(w, http.StatusBadRequest, "group_name is required")
		return
	}

	if err := h.navRepo.UpdateGroup(r.Context(), id, body.GroupName); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update group")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func (h *AdminHandler) ListNavigationGroups(w http.ResponseWriter, r *http.Request) {
	groups, err := h.navRepo.ListGroups(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch groups")
		return
	}
	helpers.JSON(w, http.StatusOK, groups)
}

// ========== User Management ==========

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userRepo.ListAll(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch users")
		return
	}
	helpers.JSON(w, http.StatusOK, users)
}

func (h *AdminHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	adminID := helpers.UserIDFromContext(r.Context())
	if id == adminID {
		helpers.Error(w, http.StatusBadRequest, "cannot change your own role")
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Role != "user" && body.Role != "admin" {
		helpers.Error(w, http.StatusBadRequest, "role must be 'user' or 'admin'")
		return
	}

	if err := h.userRepo.UpdateRole(r.Context(), id, body.Role); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update role")
		return
	}

	// Invalidate sessions so the user gets the new role on next login
	_ = h.sessionRepo.DeleteByUserID(r.Context(), id)

	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func (h *AdminHandler) ToggleUserActive(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	adminID := helpers.UserIDFromContext(r.Context())
	if id == adminID {
		helpers.Error(w, http.StatusBadRequest, "cannot deactivate yourself")
		return
	}

	var body struct {
		IsActive bool `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.userRepo.SetActive(r.Context(), id, body.IsActive); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update user status")
		return
	}

	// If deactivating, invalidate all their sessions
	if !body.IsActive {
		_ = h.sessionRepo.DeleteByUserID(r.Context(), id)
	}

	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	adminID := helpers.UserIDFromContext(r.Context())
	if id == adminID {
		helpers.Error(w, http.StatusBadRequest, "cannot delete yourself")
		return
	}

	// Invalidate sessions first
	_ = h.sessionRepo.DeleteByUserID(r.Context(), id)

	if err := h.userRepo.Delete(r.Context(), id); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to delete user")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// ========== Content Moderation — Snippets ==========

func (h *AdminHandler) ListPublicSnippets(w http.ResponseWriter, r *http.Request) {
	snippets, err := h.snippetRepo.ListAllPublic(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch snippets")
		return
	}
	helpers.JSON(w, http.StatusOK, snippets)
}

func (h *AdminHandler) VerifySnippet(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid snippet ID")
		return
	}

	adminID := helpers.UserIDFromContext(r.Context())

	var body struct {
		Verified bool `json:"verified"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.snippetRepo.VerifySnippet(r.Context(), id, adminID, body.Verified); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to verify snippet")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func (h *AdminHandler) DeleteSnippet(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid snippet ID")
		return
	}

	if err := h.snippetRepo.AdminDelete(r.Context(), id); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to delete snippet")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// ========== Content Moderation — Challenges ==========

func (h *AdminHandler) CreateChallenge(w http.ResponseWriter, r *http.Request) {
	var input models.SqlChallengeInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Slug == "" || input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "slug and title are required")
		return
	}

	challenge, err := h.sqlPracticeRepo.CreateChallenge(r.Context(), input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create challenge")
		return
	}
	helpers.JSON(w, http.StatusCreated, challenge)
}

func (h *AdminHandler) UpdateChallenge(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid challenge ID")
		return
	}

	var input models.SqlChallengeInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	challenge, err := h.sqlPracticeRepo.UpdateChallenge(r.Context(), id, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update challenge")
		return
	}
	helpers.JSON(w, http.StatusOK, challenge)
}

func (h *AdminHandler) DeleteChallenge(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid challenge ID")
		return
	}

	if err := h.sqlPracticeRepo.DeleteChallenge(r.Context(), id); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to delete challenge")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func (h *AdminHandler) TestChallenge(w http.ResponseWriter, r *http.Request) {
	var input struct {
		TableSchema string `json:"table_schema"`
		SeedData    string `json:"seed_data"`
		SolutionSQL string `json:"solution_sql"`
	}
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Run in a transaction that rolls back
	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to start transaction")
		return
	}
	defer tx.Rollback(r.Context())

	// Create schema
	if _, err := tx.Exec(r.Context(), input.TableSchema); err != nil {
		helpers.JSON(w, http.StatusOK, map[string]any{"success": false, "error": "Schema error: " + err.Error()})
		return
	}

	// Seed data
	if input.SeedData != "" {
		if _, err := tx.Exec(r.Context(), input.SeedData); err != nil {
			helpers.JSON(w, http.StatusOK, map[string]any{"success": false, "error": "Seed error: " + err.Error()})
			return
		}
	}

	// Run solution
	rows, err := tx.Query(r.Context(), input.SolutionSQL)
	if err != nil {
		helpers.JSON(w, http.StatusOK, map[string]any{"success": false, "error": "Solution error: " + err.Error()})
		return
	}
	defer rows.Close()

	cols := rows.FieldDescriptions()
	colNames := make([]string, len(cols))
	for i, c := range cols {
		colNames[i] = string(c.Name)
	}

	var resultRows [][]any
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			helpers.JSON(w, http.StatusOK, map[string]any{"success": false, "error": "Row error: " + err.Error()})
			return
		}
		resultRows = append(resultRows, vals)
	}

	helpers.JSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"columns":   colNames,
		"rows":      resultRows,
		"row_count": len(resultRows),
	})
}

// ========== Security & Audit ==========

func (h *AdminHandler) GetSystemStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.statsRepo.GetSystemStats(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch system stats")
		return
	}
	helpers.JSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) GetVaultAuditLogs(w http.ResponseWriter, r *http.Request) {
	logs, err := h.auditRepo.ListAllLogs(r.Context(), 100)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch audit logs")
		return
	}
	helpers.JSON(w, http.StatusOK, logs)
}

// ========== System Settings & Feature Toggles ==========

func (h *AdminHandler) GetSystemSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.systemRepo.GetAllSettings(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch settings")
		return
	}
	helpers.JSON(w, http.StatusOK, settings)
}

func (h *AdminHandler) UpdateSystemSetting(w http.ResponseWriter, r *http.Request) {
	adminID := helpers.UserIDFromContext(r.Context())
	var body struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Key == "" {
		helpers.Error(w, http.StatusBadRequest, "key is required")
		return
	}

	if err := h.systemRepo.SetSetting(r.Context(), body.Key, body.Value, adminID); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update setting")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func (h *AdminHandler) ListFeatureToggles(w http.ResponseWriter, r *http.Request) {
	toggles, err := h.systemRepo.ListFeatureToggles(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch feature toggles")
		return
	}
	helpers.JSON(w, http.StatusOK, toggles)
}

func (h *AdminHandler) UpdateFeatureToggle(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid toggle ID")
		return
	}

	adminID := helpers.UserIDFromContext(r.Context())

	var body struct {
		IsEnabled       bool   `json:"is_enabled"`
		DisabledMessage string `json:"disabled_message"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.systemRepo.UpdateFeatureToggle(r.Context(), id, body.IsEnabled, body.DisabledMessage, adminID); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update feature toggle")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func (h *AdminHandler) GetAnnouncement(w http.ResponseWriter, r *http.Request) {
	a, err := h.systemRepo.GetAnnouncement(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch announcement")
		return
	}
	helpers.JSON(w, http.StatusOK, a)
}

func (h *AdminHandler) SetAnnouncement(w http.ResponseWriter, r *http.Request) {
	adminID := helpers.UserIDFromContext(r.Context())

	var body struct {
		Enabled bool   `json:"enabled"`
		Message string `json:"message"`
		Type    string `json:"type"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	enabledStr := "false"
	if body.Enabled {
		enabledStr = "true"
	}
	_ = h.systemRepo.SetSetting(r.Context(), "announcement_enabled", enabledStr, adminID)
	_ = h.systemRepo.SetSetting(r.Context(), "announcement_message", body.Message, adminID)
	if body.Type == "" {
		body.Type = "info"
	}
	_ = h.systemRepo.SetSetting(r.Context(), "announcement_type", body.Type, adminID)

	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func (h *AdminHandler) SetMaintenanceMode(w http.ResponseWriter, r *http.Request) {
	adminID := helpers.UserIDFromContext(r.Context())

	var body struct {
		Enabled bool   `json:"enabled"`
		Message string `json:"message"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	enabledStr := "false"
	if body.Enabled {
		enabledStr = "true"
	}
	_ = h.systemRepo.SetSetting(r.Context(), "maintenance_mode", enabledStr, adminID)
	if body.Message != "" {
		_ = h.systemRepo.SetSetting(r.Context(), "maintenance_message", body.Message, adminID)
	}

	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// Public system endpoints

func (h *AdminHandler) GetFeatureStatuses(w http.ResponseWriter, r *http.Request) {
	toggles, err := h.systemRepo.ListFeatureToggles(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch feature statuses")
		return
	}
	helpers.JSON(w, http.StatusOK, toggles)
}
