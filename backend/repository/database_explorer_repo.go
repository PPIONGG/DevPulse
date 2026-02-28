package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

// --- DBConnectionRepo ---

type DBConnectionRepo struct {
	pool *pgxpool.Pool
}

func NewDBConnectionRepo(pool *pgxpool.Pool) *DBConnectionRepo {
	return &DBConnectionRepo{pool: pool}
}

const connColumns = `id, user_id, name, db_type, host, port, database_name, username, password_encrypted, ssl_mode, is_read_only, color, last_connected_at, created_at, updated_at`

func scanConnection(scanner interface{ Scan(dest ...any) error }, c *models.DBConnection) error {
	return scanner.Scan(
		&c.ID, &c.UserID, &c.Name, &c.DBType, &c.Host, &c.Port,
		&c.DatabaseName, &c.Username, &c.PasswordEncrypted, &c.SSLMode,
		&c.IsReadOnly, &c.Color, &c.LastConnectedAt, &c.CreatedAt, &c.UpdatedAt,
	)
}

func (r *DBConnectionRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.DBConnection, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM db_connections WHERE user_id = $1 ORDER BY updated_at DESC`, connColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conns []models.DBConnection
	for rows.Next() {
		var c models.DBConnection
		if err := scanConnection(rows, &c); err != nil {
			return nil, err
		}
		conns = append(conns, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if conns == nil {
		conns = []models.DBConnection{}
	}
	return conns, nil
}

func (r *DBConnectionRepo) GetByID(ctx context.Context, userID, connID uuid.UUID) (*models.DBConnection, error) {
	var c models.DBConnection
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM db_connections WHERE id = $1 AND user_id = $2`, connColumns),
		connID, userID,
	).Scan(
		&c.ID, &c.UserID, &c.Name, &c.DBType, &c.Host, &c.Port,
		&c.DatabaseName, &c.Username, &c.PasswordEncrypted, &c.SSLMode,
		&c.IsReadOnly, &c.Color, &c.LastConnectedAt, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *DBConnectionRepo) Create(ctx context.Context, userID uuid.UUID, name, dbType, host string, port int, dbName, username, passwordEncrypted, sslMode string, isReadOnly bool, color string) (*models.DBConnection, error) {
	var c models.DBConnection
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO db_connections (user_id, name, db_type, host, port, database_name, username, password_encrypted, ssl_mode, is_read_only, color)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING %s`, connColumns),
		userID, name, dbType, host, port, dbName, username, passwordEncrypted, sslMode, isReadOnly, color,
	).Scan(
		&c.ID, &c.UserID, &c.Name, &c.DBType, &c.Host, &c.Port,
		&c.DatabaseName, &c.Username, &c.PasswordEncrypted, &c.SSLMode,
		&c.IsReadOnly, &c.Color, &c.LastConnectedAt, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *DBConnectionRepo) Update(ctx context.Context, userID, connID uuid.UUID, name, host string, port int, dbName, username, passwordEncrypted, sslMode string, isReadOnly bool, color string) (*models.DBConnection, error) {
	var c models.DBConnection
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE db_connections
		 SET name = $3, host = $4, port = $5, database_name = $6, username = $7, password_encrypted = $8, ssl_mode = $9, is_read_only = $10, color = $11, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, connColumns),
		connID, userID, name, host, port, dbName, username, passwordEncrypted, sslMode, isReadOnly, color,
	).Scan(
		&c.ID, &c.UserID, &c.Name, &c.DBType, &c.Host, &c.Port,
		&c.DatabaseName, &c.Username, &c.PasswordEncrypted, &c.SSLMode,
		&c.IsReadOnly, &c.Color, &c.LastConnectedAt, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *DBConnectionRepo) Delete(ctx context.Context, userID, connID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM db_connections WHERE id = $1 AND user_id = $2`,
		connID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *DBConnectionRepo) TouchLastConnected(ctx context.Context, connID uuid.UUID) {
	r.pool.Exec(ctx, `UPDATE db_connections SET last_connected_at = now(), updated_at = now() WHERE id = $1`, connID)
}

// --- SavedQueryRepo ---

type SavedQueryRepo struct {
	pool *pgxpool.Pool
}

func NewSavedQueryRepo(pool *pgxpool.Pool) *SavedQueryRepo {
	return &SavedQueryRepo{pool: pool}
}

const savedQueryColumns = `id, user_id, connection_id, title, query, description, tags, is_favorite, last_run_at, created_at, updated_at`

func scanSavedQuery(scanner interface{ Scan(dest ...any) error }, q *models.SavedQuery) error {
	return scanner.Scan(
		&q.ID, &q.UserID, &q.ConnectionID, &q.Title, &q.Query,
		&q.Description, &q.Tags, &q.IsFavorite, &q.LastRunAt, &q.CreatedAt, &q.UpdatedAt,
	)
}

func (r *SavedQueryRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.SavedQuery, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM saved_queries WHERE user_id = $1 ORDER BY updated_at DESC`, savedQueryColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var queries []models.SavedQuery
	for rows.Next() {
		var q models.SavedQuery
		if err := scanSavedQuery(rows, &q); err != nil {
			return nil, err
		}
		if q.Tags == nil {
			q.Tags = []string{}
		}
		queries = append(queries, q)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if queries == nil {
		queries = []models.SavedQuery{}
	}
	return queries, nil
}

func (r *SavedQueryRepo) Create(ctx context.Context, userID uuid.UUID, input models.SavedQueryInput) (*models.SavedQuery, error) {
	var connID *uuid.UUID
	if input.ConnectionID != nil && *input.ConnectionID != "" {
		parsed, err := uuid.Parse(*input.ConnectionID)
		if err == nil {
			connID = &parsed
		}
	}
	tags := input.Tags
	if tags == nil {
		tags = []string{}
	}

	var q models.SavedQuery
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO saved_queries (user_id, connection_id, title, query, description, tags, is_favorite)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING %s`, savedQueryColumns),
		userID, connID, input.Title, input.Query, input.Description, tags, input.IsFavorite,
	).Scan(
		&q.ID, &q.UserID, &q.ConnectionID, &q.Title, &q.Query,
		&q.Description, &q.Tags, &q.IsFavorite, &q.LastRunAt, &q.CreatedAt, &q.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if q.Tags == nil {
		q.Tags = []string{}
	}
	return &q, nil
}

func (r *SavedQueryRepo) Update(ctx context.Context, userID, queryID uuid.UUID, input models.SavedQueryInput) (*models.SavedQuery, error) {
	var connID *uuid.UUID
	if input.ConnectionID != nil && *input.ConnectionID != "" {
		parsed, err := uuid.Parse(*input.ConnectionID)
		if err == nil {
			connID = &parsed
		}
	}
	tags := input.Tags
	if tags == nil {
		tags = []string{}
	}

	var q models.SavedQuery
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE saved_queries
		 SET connection_id = $3, title = $4, query = $5, description = $6, tags = $7, is_favorite = $8, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, savedQueryColumns),
		queryID, userID, connID, input.Title, input.Query, input.Description, tags, input.IsFavorite,
	).Scan(
		&q.ID, &q.UserID, &q.ConnectionID, &q.Title, &q.Query,
		&q.Description, &q.Tags, &q.IsFavorite, &q.LastRunAt, &q.CreatedAt, &q.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if q.Tags == nil {
		q.Tags = []string{}
	}
	return &q, nil
}

func (r *SavedQueryRepo) Delete(ctx context.Context, userID, queryID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM saved_queries WHERE id = $1 AND user_id = $2`,
		queryID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *SavedQueryRepo) TouchLastRun(ctx context.Context, queryID uuid.UUID) {
	r.pool.Exec(ctx, `UPDATE saved_queries SET last_run_at = now(), updated_at = now() WHERE id = $1`, queryID)
}

// --- QueryHistoryRepo ---

type QueryHistoryRepo struct {
	pool *pgxpool.Pool
}

func NewQueryHistoryRepo(pool *pgxpool.Pool) *QueryHistoryRepo {
	return &QueryHistoryRepo{pool: pool}
}

const queryHistoryColumns = `id, user_id, connection_id, query, row_count, execution_time_ms, status, error_message, created_at`

func scanQueryHistory(scanner interface{ Scan(dest ...any) error }, h *models.QueryHistoryEntry) error {
	return scanner.Scan(
		&h.ID, &h.UserID, &h.ConnectionID, &h.Query,
		&h.RowCount, &h.ExecutionTimeMs, &h.Status, &h.ErrorMessage, &h.CreatedAt,
	)
}

func (r *QueryHistoryRepo) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.QueryHistoryEntry, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM query_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, queryHistoryColumns),
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []models.QueryHistoryEntry
	for rows.Next() {
		var h models.QueryHistoryEntry
		if err := scanQueryHistory(rows, &h); err != nil {
			return nil, err
		}
		entries = append(entries, h)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if entries == nil {
		entries = []models.QueryHistoryEntry{}
	}
	return entries, nil
}

func (r *QueryHistoryRepo) Create(ctx context.Context, userID, connID uuid.UUID, query string, rowCount *int, execTimeMs *int, status, errMsg string) (*models.QueryHistoryEntry, error) {
	var h models.QueryHistoryEntry
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO query_history (user_id, connection_id, query, row_count, execution_time_ms, status, error_message)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING %s`, queryHistoryColumns),
		userID, connID, query, rowCount, execTimeMs, status, errMsg,
	).Scan(
		&h.ID, &h.UserID, &h.ConnectionID, &h.Query,
		&h.RowCount, &h.ExecutionTimeMs, &h.Status, &h.ErrorMessage, &h.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *QueryHistoryRepo) ClearByUser(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM query_history WHERE user_id = $1`, userID)
	return err
}
