package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/engine"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type DatabaseExplorerHandler struct {
	connRepo    *repository.DBConnectionRepo
	queryRepo   *repository.SavedQueryRepo
	historyRepo *repository.QueryHistoryRepo
	connMgr     *engine.ConnectionManager
}

func NewDatabaseExplorerHandler(
	connRepo *repository.DBConnectionRepo,
	queryRepo *repository.SavedQueryRepo,
	historyRepo *repository.QueryHistoryRepo,
	connMgr *engine.ConnectionManager,
) *DatabaseExplorerHandler {
	return &DatabaseExplorerHandler{
		connRepo:    connRepo,
		queryRepo:   queryRepo,
		historyRepo: historyRepo,
		connMgr:     connMgr,
	}
}

// --- Connections ---

func (h *DatabaseExplorerHandler) ListConnections(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	conns, err := h.connRepo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch connections")
		return
	}
	helpers.JSON(w, http.StatusOK, conns)
}

func (h *DatabaseExplorerHandler) CreateConnection(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.DBConnectionInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Name == "" {
		helpers.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Host == "" {
		helpers.Error(w, http.StatusBadRequest, "host is required")
		return
	}
	if input.DatabaseName == "" {
		helpers.Error(w, http.StatusBadRequest, "database name is required")
		return
	}
	if input.Username == "" {
		helpers.Error(w, http.StatusBadRequest, "username is required")
		return
	}
	if input.Port <= 0 {
		input.Port = 5432
	}
	if input.SSLMode == "" {
		input.SSLMode = "disable"
	}
	if input.Color == "" {
		input.Color = "#6b7280"
	}

	encrypted, err := h.connMgr.Encrypt(input.Password)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to encrypt password")
		return
	}

	conn, err := h.connRepo.Create(r.Context(), userID, input.Name, "postgresql", input.Host, input.Port, input.DatabaseName, input.Username, encrypted, input.SSLMode, input.IsReadOnly, input.Color)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create connection")
		return
	}
	helpers.JSON(w, http.StatusCreated, conn)
}

func (h *DatabaseExplorerHandler) UpdateConnection(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid connection ID")
		return
	}
	var input models.DBConnectionInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Name == "" {
		helpers.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Host == "" {
		helpers.Error(w, http.StatusBadRequest, "host is required")
		return
	}
	if input.DatabaseName == "" {
		helpers.Error(w, http.StatusBadRequest, "database name is required")
		return
	}
	if input.Username == "" {
		helpers.Error(w, http.StatusBadRequest, "username is required")
		return
	}
	if input.Port <= 0 {
		input.Port = 5432
	}
	if input.SSLMode == "" {
		input.SSLMode = "disable"
	}
	if input.Color == "" {
		input.Color = "#6b7280"
	}

	// Get existing connection to handle password
	existing, err := h.connRepo.GetByID(r.Context(), userID, id)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "connection not found")
		return
	}

	encrypted := existing.PasswordEncrypted
	if input.Password != "" {
		encrypted, err = h.connMgr.Encrypt(input.Password)
		if err != nil {
			helpers.Error(w, http.StatusInternalServerError, "failed to encrypt password")
			return
		}
	}

	// Close cached connection since config changed
	h.connMgr.CloseConnection(id.String())

	conn, err := h.connRepo.Update(r.Context(), userID, id, input.Name, input.Host, input.Port, input.DatabaseName, input.Username, encrypted, input.SSLMode, input.IsReadOnly, input.Color)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update connection")
		return
	}
	helpers.JSON(w, http.StatusOK, conn)
}

func (h *DatabaseExplorerHandler) DeleteConnection(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid connection ID")
		return
	}

	h.connMgr.CloseConnection(id.String())

	if err := h.connRepo.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "connection not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete connection")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *DatabaseExplorerHandler) TestConnection(w http.ResponseWriter, r *http.Request) {
	var input models.DBConnectionInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Host == "" || input.DatabaseName == "" || input.Username == "" {
		helpers.Error(w, http.StatusBadRequest, "host, database name, and username are required")
		return
	}
	if input.Port <= 0 {
		input.Port = 5432
	}
	if input.SSLMode == "" {
		input.SSLMode = "disable"
	}

	if err := h.connMgr.TestConnection(r.Context(), input); err != nil {
		helpers.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "connection successful"})
}

// --- Schema ---

func (h *DatabaseExplorerHandler) GetTables(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	connID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid connection ID")
		return
	}

	conn, err := h.connRepo.GetByID(r.Context(), userID, connID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "connection not found")
		return
	}

	pool, err := h.connMgr.GetConnection(r.Context(), conn)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	h.connRepo.TouchLastConnected(r.Context(), connID)

	tables, err := h.connMgr.GetTables(r.Context(), pool)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch tables")
		return
	}
	helpers.JSON(w, http.StatusOK, tables)
}

func (h *DatabaseExplorerHandler) GetTableDetail(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	connID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid connection ID")
		return
	}
	tableName := r.PathValue("table")
	if tableName == "" {
		helpers.Error(w, http.StatusBadRequest, "table name is required")
		return
	}

	conn, err := h.connRepo.GetByID(r.Context(), userID, connID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "connection not found")
		return
	}

	pool, err := h.connMgr.GetConnection(r.Context(), conn)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	columns, err := h.connMgr.GetTableColumns(r.Context(), pool, tableName)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch columns")
		return
	}

	fks, err := h.connMgr.GetForeignKeys(r.Context(), pool, tableName)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch foreign keys")
		return
	}

	detail := models.TableDetail{
		Table:       models.TableInfo{Name: tableName},
		Columns:     columns,
		ForeignKeys: fks,
	}
	helpers.JSON(w, http.StatusOK, detail)
}

// --- Query Execution ---

func (h *DatabaseExplorerHandler) ExecuteQuery(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var req models.QueryRequest
	if err := helpers.DecodeJSON(r, &req); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Query == "" {
		helpers.Error(w, http.StatusBadRequest, "query is required")
		return
	}

	connID, err := uuid.Parse(req.ConnectionID)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid connection ID")
		return
	}

	conn, err := h.connRepo.GetByID(r.Context(), userID, connID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "connection not found")
		return
	}

	pool, err := h.connMgr.GetConnection(r.Context(), conn)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	h.connRepo.TouchLastConnected(r.Context(), connID)

	result, err := h.connMgr.ExecuteQuery(r.Context(), pool, req.Query, req.Limit, conn.IsReadOnly)
	if err != nil {
		// Save error to history
		errMsg := err.Error()
		h.historyRepo.Create(r.Context(), userID, connID, req.Query, nil, nil, "error", errMsg)
		helpers.Error(w, http.StatusBadRequest, errMsg)
		return
	}

	// Save success to history
	h.historyRepo.Create(r.Context(), userID, connID, req.Query, &result.RowCount, &result.ExecutionTimeMs, "success", "")

	helpers.JSON(w, http.StatusOK, result)
}

// --- Saved Queries ---

func (h *DatabaseExplorerHandler) ListSavedQueries(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	queries, err := h.queryRepo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch saved queries")
		return
	}
	helpers.JSON(w, http.StatusOK, queries)
}

func (h *DatabaseExplorerHandler) CreateSavedQuery(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.SavedQueryInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Query == "" {
		helpers.Error(w, http.StatusBadRequest, "query is required")
		return
	}

	query, err := h.queryRepo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create saved query")
		return
	}
	helpers.JSON(w, http.StatusCreated, query)
}

func (h *DatabaseExplorerHandler) UpdateSavedQuery(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid query ID")
		return
	}
	var input models.SavedQueryInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Query == "" {
		helpers.Error(w, http.StatusBadRequest, "query is required")
		return
	}

	query, err := h.queryRepo.Update(r.Context(), userID, id, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update saved query")
		return
	}
	helpers.JSON(w, http.StatusOK, query)
}

func (h *DatabaseExplorerHandler) DeleteSavedQuery(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid query ID")
		return
	}
	if err := h.queryRepo.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "saved query not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete saved query")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// --- History ---

func (h *DatabaseExplorerHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	entries, err := h.historyRepo.ListByUser(r.Context(), userID, limit)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch history")
		return
	}
	helpers.JSON(w, http.StatusOK, entries)
}

func (h *DatabaseExplorerHandler) ClearHistory(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	if err := h.historyRepo.ClearByUser(r.Context(), userID); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to clear history")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "history cleared"})
}
