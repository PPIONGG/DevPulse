package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type SqlPracticeHandler struct {
	repo *repository.SqlPracticeRepo
	pool *pgxpool.Pool
}

func NewSqlPracticeHandler(repo *repository.SqlPracticeRepo, pool *pgxpool.Pool) *SqlPracticeHandler {
	return &SqlPracticeHandler{repo: repo, pool: pool}
}

func (h *SqlPracticeHandler) ListChallenges(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())

	challenges, err := h.repo.ListChallenges(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch challenges")
		return
	}

	progress, err := h.repo.GetProgress(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch progress")
		return
	}

	progressMap := make(map[uuid.UUID]models.SqlChallengeProgress)
	for _, p := range progress {
		progressMap[p.ChallengeID] = p
	}

	type ChallengeWithProgress struct {
		models.SqlChallenge
		Progress *models.SqlChallengeProgress `json:"progress"`
	}

	result := make([]ChallengeWithProgress, len(challenges))
	for i, c := range challenges {
		result[i] = ChallengeWithProgress{SqlChallenge: c}
		if p, ok := progressMap[c.ID]; ok {
			result[i].Progress = &p
		}
	}

	helpers.JSON(w, http.StatusOK, result)
}

func (h *SqlPracticeHandler) GetChallenge(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	slug := r.PathValue("slug")
	if slug == "" {
		helpers.Error(w, http.StatusBadRequest, "slug is required")
		return
	}

	challenge, err := h.repo.GetBySlug(r.Context(), slug)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "challenge not found")
		return
	}

	submissions, err := h.repo.ListSubmissions(r.Context(), userID, challenge.ID, 20)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch submissions")
		return
	}

	progress, err := h.repo.GetProgress(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch progress")
		return
	}

	var challengeProgress *models.SqlChallengeProgress
	for _, p := range progress {
		if p.ChallengeID == challenge.ID {
			challengeProgress = &p
			break
		}
	}

	prevSlug, nextSlug, _ := h.repo.GetAdjacentSlugs(r.Context(), challenge.SortOrder)

	// Only reveal solution if user has solved the challenge
	var solutionSQL *string
	if challengeProgress != nil && challengeProgress.IsSolved {
		solutionSQL = &challenge.SolutionSQL
	}

	type Response struct {
		Challenge   models.SqlChallenge         `json:"challenge"`
		Submissions []models.SqlSubmission       `json:"submissions"`
		Progress    *models.SqlChallengeProgress `json:"progress"`
		PrevSlug    string                       `json:"prev_slug"`
		NextSlug    string                       `json:"next_slug"`
		SolutionSQL *string                      `json:"solution_sql"`
	}

	helpers.JSON(w, http.StatusOK, Response{
		Challenge:   *challenge,
		Submissions: submissions,
		Progress:    challengeProgress,
		PrevSlug:    prevSlug,
		NextSlug:    nextSlug,
		SolutionSQL: solutionSQL,
	})
}

func (h *SqlPracticeHandler) validateQuery(query string) error {
	trimmed := strings.TrimSpace(strings.ToUpper(query))
	if !strings.HasPrefix(trimmed, "SELECT") && !strings.HasPrefix(trimmed, "WITH") {
		return fmt.Errorf("only SELECT and WITH (CTE) queries are allowed")
	}
	if containsMultipleStatements(query) {
		return fmt.Errorf("only single statements are allowed")
	}
	return nil
}

func (h *SqlPracticeHandler) SubmitAnswer(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())

	var req models.SqlSubmitRequest
	if err := helpers.DecodeJSON(r, &req); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Query == "" {
		helpers.Error(w, http.StatusBadRequest, "query is required")
		return
	}

	if err := h.validateQuery(req.Query); err != nil {
		helpers.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	challengeID, err := uuid.Parse(req.ChallengeID)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid challenge_id")
		return
	}

	challenge, err := h.repo.GetByID(r.Context(), challengeID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "challenge not found")
		return
	}

	result := h.executeAndJudge(r.Context(), challenge, req.Query)

	sub := models.SqlSubmission{
		ChallengeID:  challengeID,
		Query:        req.Query,
		Status:       result.Status,
		ErrorMessage: result.ErrorMessage,
	}
	if result.ExecutionTimeMs > 0 {
		ms := result.ExecutionTimeMs
		sub.ExecutionTimeMs = &ms
	}
	if _, err := h.repo.CreateSubmission(r.Context(), userID, sub); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to save submission")
		return
	}
	if err := h.repo.UpsertProgress(r.Context(), userID, challengeID, result.Status == "correct", result.ExecutionTimeMs); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update progress")
		return
	}

	helpers.JSON(w, http.StatusOK, result)
}

func (h *SqlPracticeHandler) RunQuery(w http.ResponseWriter, r *http.Request) {
	var req models.SqlSubmitRequest
	if err := helpers.DecodeJSON(r, &req); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Query == "" {
		helpers.Error(w, http.StatusBadRequest, "query is required")
		return
	}

	if err := h.validateQuery(req.Query); err != nil {
		helpers.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	challengeID, err := uuid.Parse(req.ChallengeID)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid challenge_id")
		return
	}

	challenge, err := h.repo.GetByID(r.Context(), challengeID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "challenge not found")
		return
	}

	result := h.executeAndJudge(r.Context(), challenge, req.Query)

	// RunQuery is preview-only: no submission or progress recorded
	helpers.JSON(w, http.StatusOK, result)
}

func (h *SqlPracticeHandler) executeAndJudge(ctx context.Context, challenge *models.SqlChallenge, userQuery string) models.SqlSubmitResult {
	execCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	tx, err := h.pool.Begin(execCtx)
	if err != nil {
		return models.SqlSubmitResult{
			Status:       "error",
			ErrorMessage: "failed to start sandbox",
		}
	}
	defer tx.Rollback(context.Background())

	if _, err := tx.Exec(execCtx, challenge.TableSchema); err != nil {
		return models.SqlSubmitResult{
			Status:       "error",
			ErrorMessage: "failed to setup sandbox schema",
		}
	}

	if _, err := tx.Exec(execCtx, challenge.SeedData); err != nil {
		return models.SqlSubmitResult{
			Status:       "error",
			ErrorMessage: "failed to seed sandbox data",
		}
	}

	start := time.Now()
	userResult, userErr := runQueryInTx(execCtx, tx, userQuery)
	elapsed := int(time.Since(start).Milliseconds())

	if userErr != nil {
		return models.SqlSubmitResult{
			Status:          "error",
			ExecutionTimeMs: elapsed,
			ErrorMessage:    sanitizeDbError(userErr.Error()),
		}
	}

	expectedResult, expectedErr := runQueryInTx(execCtx, tx, challenge.SolutionSQL)
	if expectedErr != nil {
		return models.SqlSubmitResult{
			Status:       "error",
			ErrorMessage: "internal error running reference solution",
		}
	}

	isCorrect := compareResults(userResult, expectedResult, challenge.OrderSensitive)

	if isCorrect {
		return models.SqlSubmitResult{
			Status:          "correct",
			UserResult:      userResult,
			ExecutionTimeMs: elapsed,
		}
	}

	return models.SqlSubmitResult{
		Status:          "wrong",
		UserResult:      userResult,
		ExpectedResult:  expectedResult,
		ExecutionTimeMs: elapsed,
	}
}

func runQueryInTx(ctx context.Context, tx pgx.Tx, query string) (*models.QueryResult, error) {
	rows, err := tx.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fieldDescs := rows.FieldDescriptions()
	columns := make([]string, len(fieldDescs))
	for i, fd := range fieldDescs {
		columns[i] = string(fd.Name)
	}

	var resultRows [][]interface{}
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return nil, err
		}
		row := make([]interface{}, len(values))
		for i, v := range values {
			row[i] = formatSqlValue(v)
		}
		resultRows = append(resultRows, row)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if resultRows == nil {
		resultRows = [][]interface{}{}
	}

	return &models.QueryResult{
		Columns:  columns,
		Rows:     resultRows,
		RowCount: len(resultRows),
	}, nil
}

func formatSqlValue(v interface{}) interface{} {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case time.Time:
		return val.Format(time.RFC3339)
	case []byte:
		return string(val)
	case [16]byte:
		return fmt.Sprintf("%x-%x-%x-%x-%x", val[0:4], val[4:6], val[6:8], val[8:10], val[10:16])
	case float32:
		if float32(int64(val)) == val {
			return int64(val)
		}
		return val
	case float64:
		if float64(int64(val)) == val {
			return int64(val)
		}
		return val
	default:
		return val
	}
}

func (h *SqlPracticeHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())

	stats, err := h.repo.GetStats(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch stats")
		return
	}

	helpers.JSON(w, http.StatusOK, stats)
}

func (h *SqlPracticeHandler) ListSubmissions(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())

	challengeIDStr := r.PathValue("challengeId")
	challengeID, err := uuid.Parse(challengeIDStr)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid challenge ID")
		return
	}

	subs, err := h.repo.ListSubmissions(r.Context(), userID, challengeID, 50)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch submissions")
		return
	}

	helpers.JSON(w, http.StatusOK, subs)
}

func compareResults(user, expected *models.QueryResult, orderSensitive bool) bool {
	if user == nil || expected == nil {
		return false
	}

	if len(user.Columns) != len(expected.Columns) {
		return false
	}

	for i := range user.Columns {
		if !strings.EqualFold(user.Columns[i], expected.Columns[i]) {
			return false
		}
	}

	if len(user.Rows) != len(expected.Rows) {
		return false
	}

	userRows := rowsToStrings(user.Rows)
	expectedRows := rowsToStrings(expected.Rows)

	if !orderSensitive {
		sort.Strings(userRows)
		sort.Strings(expectedRows)
	}

	for i := range userRows {
		if userRows[i] != expectedRows[i] {
			return false
		}
	}

	return true
}

func rowsToStrings(rows [][]interface{}) []string {
	result := make([]string, len(rows))
	for i, row := range rows {
		b, _ := json.Marshal(row)
		result[i] = string(b)
	}
	return result
}

// containsMultipleStatements strips string literals and comments, then checks for semicolons.
func containsMultipleStatements(query string) bool {
	stripped := stripSqlLiteralsAndComments(query)
	// Count semicolons that aren't trailing
	trimmed := strings.TrimSpace(stripped)
	trimmed = strings.TrimRight(trimmed, ";")
	return strings.Contains(trimmed, ";")
}

func stripSqlLiteralsAndComments(s string) string {
	var buf strings.Builder
	i := 0
	for i < len(s) {
		// Single-line comment
		if i+1 < len(s) && s[i] == '-' && s[i+1] == '-' {
			for i < len(s) && s[i] != '\n' {
				i++
			}
			continue
		}
		// Block comment
		if i+1 < len(s) && s[i] == '/' && s[i+1] == '*' {
			i += 2
			for i+1 < len(s) && !(s[i] == '*' && s[i+1] == '/') {
				i++
			}
			if i+1 < len(s) {
				i += 2
			}
			continue
		}
		// String literal (single quote)
		if s[i] == '\'' {
			i++
			for i < len(s) {
				if s[i] == '\'' {
					i++
					if i < len(s) && s[i] == '\'' {
						i++ // escaped quote
						continue
					}
					break
				}
				i++
			}
			continue
		}
		buf.WriteByte(s[i])
		i++
	}
	return buf.String()
}

func sanitizeDbError(msg string) string {
	// Strip "ERROR: " prefix
	msg = strings.TrimPrefix(msg, "ERROR: ")
	// Strip "(SQLSTATE ...)" suffix
	if idx := strings.LastIndex(msg, "(SQLSTATE"); idx != -1 {
		msg = strings.TrimSpace(msg[:idx])
	}
	// Truncate
	if len(msg) > 300 {
		msg = msg[:300] + "..."
	}
	return msg
}
