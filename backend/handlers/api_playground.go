package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type ApiPlaygroundHandler struct {
	repo         *repository.ApiPlaygroundRepo
	envVaultRepo *repository.EnvVaultRepo
}

func NewApiPlaygroundHandler(repo *repository.ApiPlaygroundRepo, envVaultRepo *repository.EnvVaultRepo) *ApiPlaygroundHandler {
	return &ApiPlaygroundHandler{repo: repo, envVaultRepo: envVaultRepo}
}

// --- Collections ---

func (h *ApiPlaygroundHandler) ListCollections(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	collections, uncollected, err := h.repo.ListCollections(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch collections")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]any{
		"collections": collections,
		"uncollected": uncollected,
	})
}

func (h *ApiPlaygroundHandler) CreateCollection(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.ApiCollectionInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	col, err := h.repo.CreateCollection(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create collection")
		return
	}
	helpers.JSON(w, http.StatusCreated, col)
}

func (h *ApiPlaygroundHandler) UpdateCollection(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid collection ID")
		return
	}
	var input models.ApiCollectionInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	col, err := h.repo.UpdateCollection(r.Context(), userID, id, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update collection")
		return
	}
	helpers.JSON(w, http.StatusOK, col)
}

func (h *ApiPlaygroundHandler) DeleteCollection(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid collection ID")
		return
	}
	if err := h.repo.DeleteCollection(r.Context(), userID, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "collection not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete collection")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// --- Requests ---

func (h *ApiPlaygroundHandler) GetRequest(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request ID")
		return
	}
	req, err := h.repo.GetRequest(r.Context(), userID, id)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "request not found")
		return
	}
	helpers.JSON(w, http.StatusOK, req)
}

func (h *ApiPlaygroundHandler) CreateRequest(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.ApiRequestInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Method == "" {
		input.Method = "GET"
	}
	if input.BodyType == "" {
		input.BodyType = "none"
	}
	req, err := h.repo.CreateRequest(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create request")
		return
	}
	helpers.JSON(w, http.StatusCreated, req)
}

func (h *ApiPlaygroundHandler) UpdateRequest(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request ID")
		return
	}
	var input models.ApiRequestInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Method == "" {
		input.Method = "GET"
	}
	if input.BodyType == "" {
		input.BodyType = "none"
	}
	req, err := h.repo.UpdateRequest(r.Context(), userID, id, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update request")
		return
	}
	helpers.JSON(w, http.StatusOK, req)
}

func (h *ApiPlaygroundHandler) DeleteRequest(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request ID")
		return
	}
	if err := h.repo.DeleteRequest(r.Context(), userID, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "request not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete request")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *ApiPlaygroundHandler) MoveRequest(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request ID")
		return
	}
	var body struct {
		CollectionID *uuid.UUID `json:"collection_id"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req, err := h.repo.MoveRequest(r.Context(), userID, id, body.CollectionID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to move request")
		return
	}
	helpers.JSON(w, http.StatusOK, req)
}

// --- History ---

func (h *ApiPlaygroundHandler) ListHistory(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	history, err := h.repo.ListHistory(r.Context(), userID, limit)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch history")
		return
	}
	helpers.JSON(w, http.StatusOK, history)
}

func (h *ApiPlaygroundHandler) DeleteHistoryItem(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid history ID")
		return
	}
	if err := h.repo.DeleteHistory(r.Context(), userID, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "history item not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete history item")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *ApiPlaygroundHandler) ClearHistory(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	if err := h.repo.ClearHistory(r.Context(), userID); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to clear history")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "cleared"})
}

// --- Send (Proxy) ---

var allowedMethods = map[string]bool{
	"GET": true, "POST": true, "PUT": true, "PATCH": true,
	"DELETE": true, "HEAD": true, "OPTIONS": true,
}

func (h *ApiPlaygroundHandler) SendRequest(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var proxy models.ApiProxyRequest
	if err := helpers.DecodeJSON(r, &proxy); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate method
	method := strings.ToUpper(proxy.Method)
	if !allowedMethods[method] {
		helpers.Error(w, http.StatusBadRequest, "invalid HTTP method")
		return
	}

	// Validate URL scheme
	url := proxy.URL
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		helpers.Error(w, http.StatusBadRequest, "URL must start with http:// or https://")
		return
	}

	// Parse headers
	var headers []models.KeyValuePair
	if proxy.Headers != nil {
		if err := json.Unmarshal(proxy.Headers, &headers); err != nil {
			helpers.Error(w, http.StatusBadRequest, "invalid headers format")
			return
		}
	}

	body := proxy.Body

	// Resolve env vault variables if env_vault_id is set
	if proxy.EnvVaultID != nil {
		vault, err := h.envVaultRepo.GetByID(r.Context(), userID, *proxy.EnvVaultID)
		if err == nil {
			for _, v := range vault.Variables {
				placeholder := fmt.Sprintf("{{%s}}", v.Key)
				url = strings.ReplaceAll(url, placeholder, v.Value)
				body = strings.ReplaceAll(body, placeholder, v.Value)
				for i := range headers {
					headers[i].Value = strings.ReplaceAll(headers[i].Value, placeholder, v.Value)
				}
			}
		}
	}

	// Build outgoing request
	var bodyReader io.Reader
	if body != "" && method != "GET" && method != "HEAD" {
		bodyReader = strings.NewReader(body)
	}

	outReq, err := http.NewRequestWithContext(r.Context(), method, url, bodyReader)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "failed to build request: "+err.Error())
		return
	}

	// Set headers
	outReq.Header.Set("User-Agent", "DevPulse/1.0")
	for _, h := range headers {
		if h.Enabled && h.Key != "" {
			outReq.Header.Set(h.Key, h.Value)
		}
	}

	// Set timeout
	timeout := proxy.TimeoutSecs
	if timeout <= 0 {
		timeout = 30
	}
	if timeout > 60 {
		timeout = 60
	}

	client := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return fmt.Errorf("too many redirects")
			}
			return nil
		},
	}

	start := time.Now()
	resp, err := client.Do(outReq)
	elapsed := time.Since(start)

	if err != nil {
		helpers.Error(w, http.StatusBadGateway, "request failed: "+err.Error())
		return
	}
	defer resp.Body.Close()

	// Read body up to 5MB
	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		helpers.Error(w, http.StatusBadGateway, "failed to read response body")
		return
	}

	// Marshal response headers
	respHeadersMap := make(map[string]string)
	for k := range resp.Header {
		respHeadersMap[k] = resp.Header.Get(k)
	}
	respHeadersJSON, _ := json.Marshal(respHeadersMap)

	// Build proxy response
	proxyResp := models.ApiProxyResponse{
		Status:     resp.StatusCode,
		StatusText: resp.Status,
		Headers:    respHeadersJSON,
		Body:       string(respBody),
		Size:       int64(len(respBody)),
		TimeMs:     int(elapsed.Milliseconds()),
	}

	// Save to history
	reqHeadersJSON, _ := json.Marshal(headers)
	histEntry := models.ApiRequestHistory{
		RequestID:       proxy.RequestID,
		Method:          method,
		URL:             url,
		RequestHeaders:  reqHeadersJSON,
		RequestBody:     body,
		ResponseStatus:  resp.StatusCode,
		ResponseHeaders: respHeadersJSON,
		ResponseBody:    string(respBody),
		ResponseSize:    int64(len(respBody)),
		ResponseTimeMs:  int(elapsed.Milliseconds()),
	}
	h.repo.CreateHistory(r.Context(), userID, histEntry)

	helpers.JSON(w, http.StatusOK, proxyResp)
}
