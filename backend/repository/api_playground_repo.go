package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type ApiPlaygroundRepo struct {
	pool *pgxpool.Pool
}

func NewApiPlaygroundRepo(pool *pgxpool.Pool) *ApiPlaygroundRepo {
	return &ApiPlaygroundRepo{pool: pool}
}

const collectionColumns = `id, user_id, title, description, is_favorite, created_at, updated_at`
const apiRequestColumns = `id, user_id, collection_id, title, method, url, headers, query_params, body_type, body, env_vault_id, sort_order, created_at, updated_at`
const historyColumns = `id, user_id, request_id, method, url, request_headers, request_body, response_status, response_headers, response_body, response_size, response_time_ms, created_at`

func scanCollection(scanner interface{ Scan(dest ...any) error }, c *models.ApiCollection) error {
	return scanner.Scan(&c.ID, &c.UserID, &c.Title, &c.Description, &c.IsFavorite, &c.CreatedAt, &c.UpdatedAt)
}

func scanApiRequest(scanner interface{ Scan(dest ...any) error }, r *models.ApiRequest) error {
	return scanner.Scan(&r.ID, &r.UserID, &r.CollectionID, &r.Title, &r.Method, &r.URL, &r.Headers, &r.QueryParams, &r.BodyType, &r.Body, &r.EnvVaultID, &r.SortOrder, &r.CreatedAt, &r.UpdatedAt)
}

func scanHistory(scanner interface{ Scan(dest ...any) error }, h *models.ApiRequestHistory) error {
	return scanner.Scan(&h.ID, &h.UserID, &h.RequestID, &h.Method, &h.URL, &h.RequestHeaders, &h.RequestBody, &h.ResponseStatus, &h.ResponseHeaders, &h.ResponseBody, &h.ResponseSize, &h.ResponseTimeMs, &h.CreatedAt)
}

// --- Collections ---

func (r *ApiPlaygroundRepo) ListCollections(ctx context.Context, userID uuid.UUID) ([]models.ApiCollection, []models.ApiRequest, error) {
	// Fetch collections
	colRows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM api_collections WHERE user_id = $1 ORDER BY updated_at DESC`, collectionColumns),
		userID,
	)
	if err != nil {
		return nil, nil, err
	}
	defer colRows.Close()

	var collections []models.ApiCollection
	colMap := make(map[uuid.UUID]int)
	for colRows.Next() {
		var c models.ApiCollection
		if err := scanCollection(colRows, &c); err != nil {
			return nil, nil, err
		}
		c.Requests = []models.ApiRequest{}
		colMap[c.ID] = len(collections)
		collections = append(collections, c)
	}
	if err := colRows.Err(); err != nil {
		return nil, nil, err
	}

	// Fetch all requests for this user
	reqRows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM api_requests WHERE user_id = $1 ORDER BY sort_order ASC, created_at ASC`, apiRequestColumns),
		userID,
	)
	if err != nil {
		return nil, nil, err
	}
	defer reqRows.Close()

	var uncollected []models.ApiRequest
	for reqRows.Next() {
		var req models.ApiRequest
		if err := scanApiRequest(reqRows, &req); err != nil {
			return nil, nil, err
		}
		if req.CollectionID != nil {
			if idx, ok := colMap[*req.CollectionID]; ok {
				collections[idx].Requests = append(collections[idx].Requests, req)
				continue
			}
		}
		uncollected = append(uncollected, req)
	}
	if err := reqRows.Err(); err != nil {
		return nil, nil, err
	}

	if collections == nil {
		collections = []models.ApiCollection{}
	}
	if uncollected == nil {
		uncollected = []models.ApiRequest{}
	}
	return collections, uncollected, nil
}

func (r *ApiPlaygroundRepo) CreateCollection(ctx context.Context, userID uuid.UUID, input models.ApiCollectionInput) (*models.ApiCollection, error) {
	var c models.ApiCollection
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO api_collections (user_id, title, description, is_favorite)
		 VALUES ($1, $2, $3, $4)
		 RETURNING %s`, collectionColumns),
		userID, input.Title, input.Description, input.IsFavorite,
	).Scan(&c.ID, &c.UserID, &c.Title, &c.Description, &c.IsFavorite, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	c.Requests = []models.ApiRequest{}
	return &c, nil
}

func (r *ApiPlaygroundRepo) UpdateCollection(ctx context.Context, userID, colID uuid.UUID, input models.ApiCollectionInput) (*models.ApiCollection, error) {
	var c models.ApiCollection
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE api_collections
		 SET title = $3, description = $4, is_favorite = $5, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, collectionColumns),
		colID, userID, input.Title, input.Description, input.IsFavorite,
	).Scan(&c.ID, &c.UserID, &c.Title, &c.Description, &c.IsFavorite, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	c.Requests = []models.ApiRequest{}
	return &c, nil
}

func (r *ApiPlaygroundRepo) DeleteCollection(ctx context.Context, userID, colID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM api_collections WHERE id = $1 AND user_id = $2`,
		colID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// --- Requests ---

func (r *ApiPlaygroundRepo) GetRequest(ctx context.Context, userID, reqID uuid.UUID) (*models.ApiRequest, error) {
	var req models.ApiRequest
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM api_requests WHERE id = $1 AND user_id = $2`, apiRequestColumns),
		reqID, userID,
	).Scan(&req.ID, &req.UserID, &req.CollectionID, &req.Title, &req.Method, &req.URL, &req.Headers, &req.QueryParams, &req.BodyType, &req.Body, &req.EnvVaultID, &req.SortOrder, &req.CreatedAt, &req.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *ApiPlaygroundRepo) CreateRequest(ctx context.Context, userID uuid.UUID, input models.ApiRequestInput) (*models.ApiRequest, error) {
	var req models.ApiRequest
	headers := input.Headers
	if headers == nil {
		headers = []byte("[]")
	}
	queryParams := input.QueryParams
	if queryParams == nil {
		queryParams = []byte("[]")
	}
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO api_requests (user_id, collection_id, title, method, url, headers, query_params, body_type, body, env_vault_id, sort_order)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING %s`, apiRequestColumns),
		userID, input.CollectionID, input.Title, input.Method, input.URL, headers, queryParams, input.BodyType, input.Body, input.EnvVaultID, input.SortOrder,
	).Scan(&req.ID, &req.UserID, &req.CollectionID, &req.Title, &req.Method, &req.URL, &req.Headers, &req.QueryParams, &req.BodyType, &req.Body, &req.EnvVaultID, &req.SortOrder, &req.CreatedAt, &req.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *ApiPlaygroundRepo) UpdateRequest(ctx context.Context, userID, reqID uuid.UUID, input models.ApiRequestInput) (*models.ApiRequest, error) {
	var req models.ApiRequest
	headers := input.Headers
	if headers == nil {
		headers = []byte("[]")
	}
	queryParams := input.QueryParams
	if queryParams == nil {
		queryParams = []byte("[]")
	}
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE api_requests
		 SET collection_id = $3, title = $4, method = $5, url = $6, headers = $7, query_params = $8, body_type = $9, body = $10, env_vault_id = $11, sort_order = $12, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, apiRequestColumns),
		reqID, userID, input.CollectionID, input.Title, input.Method, input.URL, headers, queryParams, input.BodyType, input.Body, input.EnvVaultID, input.SortOrder,
	).Scan(&req.ID, &req.UserID, &req.CollectionID, &req.Title, &req.Method, &req.URL, &req.Headers, &req.QueryParams, &req.BodyType, &req.Body, &req.EnvVaultID, &req.SortOrder, &req.CreatedAt, &req.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *ApiPlaygroundRepo) DeleteRequest(ctx context.Context, userID, reqID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM api_requests WHERE id = $1 AND user_id = $2`,
		reqID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *ApiPlaygroundRepo) MoveRequest(ctx context.Context, userID, reqID uuid.UUID, collectionID *uuid.UUID) (*models.ApiRequest, error) {
	var req models.ApiRequest
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE api_requests
		 SET collection_id = $3, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, apiRequestColumns),
		reqID, userID, collectionID,
	).Scan(&req.ID, &req.UserID, &req.CollectionID, &req.Title, &req.Method, &req.URL, &req.Headers, &req.QueryParams, &req.BodyType, &req.Body, &req.EnvVaultID, &req.SortOrder, &req.CreatedAt, &req.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

// --- History ---

func (r *ApiPlaygroundRepo) ListHistory(ctx context.Context, userID uuid.UUID, limit int) ([]models.ApiRequestHistory, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM api_request_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, historyColumns),
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []models.ApiRequestHistory
	for rows.Next() {
		var h models.ApiRequestHistory
		if err := scanHistory(rows, &h); err != nil {
			return nil, err
		}
		history = append(history, h)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if history == nil {
		history = []models.ApiRequestHistory{}
	}
	return history, nil
}

func (r *ApiPlaygroundRepo) CreateHistory(ctx context.Context, userID uuid.UUID, h models.ApiRequestHistory) (*models.ApiRequestHistory, error) {
	reqHeaders := h.RequestHeaders
	if reqHeaders == nil {
		reqHeaders = []byte("[]")
	}
	respHeaders := h.ResponseHeaders
	if respHeaders == nil {
		respHeaders = []byte("{}")
	}
	var created models.ApiRequestHistory
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO api_request_history (user_id, request_id, method, url, request_headers, request_body, response_status, response_headers, response_body, response_size, response_time_ms)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING %s`, historyColumns),
		userID, h.RequestID, h.Method, h.URL, reqHeaders, h.RequestBody, h.ResponseStatus, respHeaders, h.ResponseBody, h.ResponseSize, h.ResponseTimeMs,
	).Scan(&created.ID, &created.UserID, &created.RequestID, &created.Method, &created.URL, &created.RequestHeaders, &created.RequestBody, &created.ResponseStatus, &created.ResponseHeaders, &created.ResponseBody, &created.ResponseSize, &created.ResponseTimeMs, &created.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &created, nil
}

func (r *ApiPlaygroundRepo) DeleteHistory(ctx context.Context, userID, historyID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM api_request_history WHERE id = $1 AND user_id = $2`,
		historyID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *ApiPlaygroundRepo) ClearHistory(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM api_request_history WHERE user_id = $1`,
		userID,
	)
	return err
}
