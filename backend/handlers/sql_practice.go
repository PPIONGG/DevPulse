package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
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
	repo        *repository.SqlPracticeRepo
	profileRepo *repository.ProfileRepo
	pool        *pgxpool.Pool
}

func NewSqlPracticeHandler(repo *repository.SqlPracticeRepo, profileRepo *repository.ProfileRepo, pool *pgxpool.Pool) *SqlPracticeHandler {
	return &SqlPracticeHandler{repo: repo, profileRepo: profileRepo, pool: pool}
}

func (h *SqlPracticeHandler) getLanguage(ctx context.Context, userID uuid.UUID) string {
	profile, err := h.profileRepo.FindByID(ctx, userID)
	if err != nil {
		return "en"
	}
	return profile.PreferredLanguage
}

func (h *SqlPracticeHandler) ListChallenges(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	lang := h.getLanguage(r.Context(), userID)

	challenges, err := h.repo.ListChallenges(r.Context())
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch challenges")
		return
	}

	// Translate if needed
	if lang == "th" {
		for i := range challenges {
			if challenges[i].TitleTH != nil && *challenges[i].TitleTH != "" {
				challenges[i].Title = *challenges[i].TitleTH
			}
			if challenges[i].DescriptionTH != nil && *challenges[i].DescriptionTH != "" {
				challenges[i].Description = *challenges[i].DescriptionTH
			}
			if challenges[i].HintTH != nil && *challenges[i].HintTH != "" {
				challenges[i].Hint = *challenges[i].HintTH
			}
		}
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

	lang := h.getLanguage(r.Context(), userID)
	if lang == "th" {
		if challenge.TitleTH != nil && *challenge.TitleTH != "" {
			challenge.Title = *challenge.TitleTH
		}
		if challenge.DescriptionTH != nil && *challenge.DescriptionTH != "" {
			challenge.Description = *challenge.DescriptionTH
		}
		if challenge.HintTH != nil && *challenge.HintTH != "" {
			challenge.Hint = *challenge.HintTH
		}
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

	// Parse schema for visual display
	challenge.Metadata = parseSchema(challenge.TableSchema)

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
	allowedPrefixes := []string{"SELECT", "WITH", "INSERT", "UPDATE", "DELETE"}
	
	isValid := false
	for _, prefix := range allowedPrefixes {
		if strings.HasPrefix(trimmed, prefix) {
			isValid = true
			break
		}
	}

	if !isValid {
		return fmt.Errorf("only SELECT, WITH, INSERT, UPDATE, and DELETE queries are allowed")
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

	result := h.executeAndJudge(r.Context(), challenge.TableSchema, challenge.SeedData, req.Query, challenge.SolutionSQL, challenge.OrderSensitive)

	sub := models.SqlSubmission{
		ChallengeID:  challengeID,
		Query:        req.Query,
		Status:       result.Status,
		ErrorMessage: result.ErrorMessage,
		QueryPlan:    &result.QueryPlan,
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

	result := h.executeAndJudge(r.Context(), challenge.TableSchema, challenge.SeedData, req.Query, challenge.SolutionSQL, challenge.OrderSensitive)

	// RunQuery is preview-only: no submission or progress recorded
	helpers.JSON(w, http.StatusOK, result)
}

func (h *SqlPracticeHandler) executeAndJudge(ctx context.Context, tableSchema, seedData, userQuery, solutionSQL string, orderSensitive bool) models.SqlSubmitResult {
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

	// Set a timeout for the statement execution to prevent long-running queries
	if _, err := tx.Exec(execCtx, "SET statement_timeout = '5s'"); err != nil {
		// Just log or ignore if fails, not critical
	}

	if _, err := tx.Exec(execCtx, tableSchema); err != nil {
		return models.SqlSubmitResult{
			Status:       "error",
			ErrorMessage: "failed to setup sandbox schema",
		}
	}

	if _, err := tx.Exec(execCtx, seedData); err != nil {
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

	expectedResult, expectedErr := runQueryInTx(execCtx, tx, solutionSQL)
	if expectedErr != nil {
		return models.SqlSubmitResult{
			Status:       "error",
			ErrorMessage: "internal error running reference solution",
		}
	}

	isCorrect := compareResults(userResult, expectedResult, orderSensitive)

	// Explain Plan for performance analysis
	var plan []string
	if rows, err := tx.Query(execCtx, "EXPLAIN (FORMAT TEXT) "+userQuery); err == nil {
		for rows.Next() {
			var line string
			if err := rows.Scan(&line); err == nil {
				plan = append(plan, line)
			}
		}
		rows.Close()
	}

	res := models.SqlSubmitResult{
		ExecutionTimeMs: elapsed,
		UserResult:      userResult,
		ExpectedResult:  expectedResult,
		QueryPlan:       strings.Join(plan, "\n"),
	}

	if isCorrect {
		res.Status = "correct"
	} else {
		res.Status = "wrong"
	}

	return res
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

func (h *SqlPracticeHandler) ListTopSolutions(w http.ResponseWriter, r *http.Request) {
	challengeIDStr := r.PathValue("challengeId")
	challengeID, err := uuid.Parse(challengeIDStr)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid challenge ID")
		return
	}

	solutions, err := h.repo.GetTopSolutions(r.Context(), challengeID, 10)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch top solutions")
		return
	}

	helpers.JSON(w, http.StatusOK, solutions)
}

func (h *SqlPracticeHandler) ExplainQuery(w http.ResponseWriter, r *http.Request) {
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

	execCtx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	tx, err := h.pool.Begin(execCtx)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to start sandbox")
		return
	}
	defer tx.Rollback(context.Background())

	if _, err := tx.Exec(execCtx, challenge.TableSchema); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to setup sandbox schema")
		return
	}

	if _, err := tx.Exec(execCtx, challenge.SeedData); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to seed sandbox data")
		return
	}

	// Run EXPLAIN ANALYZE
	explainQuery := "EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) " + req.Query
	rows, err := tx.Query(execCtx, explainQuery)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, sanitizeDbError(err.Error()))
		return
	}
	defer rows.Close()

	var plan []string
	for rows.Next() {
		var line string
		if err := rows.Scan(&line); err != nil {
			break
		}
		plan = append(plan, line)
	}

	helpers.JSON(w, http.StatusOK, map[string]string{
		"plan": strings.Join(plan, "\n"),
	})
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

func parseSchema(schema string) *models.ChallengeMetadata {
	metadata := &models.ChallengeMetadata{Tables: []models.TableMetadata{}}

	tableRegex := regexp.MustCompile(`(?i)CREATE\s+(?:TEMP\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]+?)\);`)
	colRegex := regexp.MustCompile(`(?i)^\s*(\w+)\s+([\w\(\),.]+)`)

	tableMatches := tableRegex.FindAllStringSubmatch(schema, -1)
	for _, match := range tableMatches {
		tableName := match[1]
		colsStr := match[2]
		
		table := models.TableMetadata{
			Name:    tableName,
			Columns: []models.ColumnMetadata{},
		}

		lines := strings.Split(colsStr, ",")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			// Skip constraints
			upperLine := strings.ToUpper(line)
			if strings.HasPrefix(upperLine, "PRIMARY KEY") || 
			   strings.HasPrefix(upperLine, "FOREIGN KEY") || 
			   strings.HasPrefix(upperLine, "CONSTRAINT") ||
			   strings.HasPrefix(upperLine, "UNIQUE") ||
			   strings.HasPrefix(upperLine, "CHECK") {
				continue
			}

			colMatch := colRegex.FindStringSubmatch(line)
			if len(colMatch) >= 3 {
				table.Columns = append(table.Columns, models.ColumnMetadata{
					Name: colMatch[1],
					Type: colMatch[2],
				})
			}
		}
		metadata.Tables = append(metadata.Tables, table)
	}

	return metadata
}

func (h *SqlPracticeHandler) PreviewTable(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	slug := r.PathValue("slug")
	tableName := r.PathValue("tableName")

	if slug == "" || tableName == "" {
		helpers.Error(w, http.StatusBadRequest, "slug and tableName are required")
		return
	}

	challenge, err := h.repo.GetBySlug(r.Context(), slug)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "challenge not found")
		return
	}

	lang := h.getLanguage(r.Context(), userID)
	if lang == "th" {
		if challenge.TitleTH != nil && *challenge.TitleTH != "" {
			challenge.Title = *challenge.TitleTH
		}
		if challenge.DescriptionTH != nil && *challenge.DescriptionTH != "" {
			challenge.Description = *challenge.DescriptionTH
		}
		if challenge.HintTH != nil && *challenge.HintTH != "" {
			challenge.Hint = *challenge.HintTH
		}
	}

	// Simple sandbox execution for preview
	execCtx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	tx, err := h.pool.Begin(execCtx)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to start sandbox")
		return
	}
	defer tx.Rollback(context.Background())

	if _, err := tx.Exec(execCtx, challenge.TableSchema); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to setup sandbox schema")
		return
	}

	if _, err := tx.Exec(execCtx, challenge.SeedData); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to seed sandbox data")
		return
	}

	query := fmt.Sprintf("SELECT * FROM %s LIMIT 50", tableName)
	result, err := runQueryInTx(execCtx, tx, query)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "failed to preview table: "+err.Error())
		return
	}

	helpers.JSON(w, http.StatusOK, result)
}

// Academy Handlers

func (h *SqlPracticeHandler) ListLessons(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	lang := h.getLanguage(r.Context(), userID)

	lessons, err := h.repo.ListLessons(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch lessons")
		return
	}

	// Group lessons by module
	modulesMap := make(map[string]*models.SqlModuleWithLessons)
	var moduleIDs []string

	for _, l := range lessons {
		// Translate lesson if needed
		if lang == "th" {
			if l.ModuleTitleTH != nil && *l.ModuleTitleTH != "" {
				l.ModuleTitle = *l.ModuleTitleTH
			}
			if l.TitleTH != nil && *l.TitleTH != "" {
				l.Title = *l.TitleTH
			}
			if l.DescriptionTH != nil && *l.DescriptionTH != "" {
				l.Description = *l.DescriptionTH
			}
			if l.ContentTH != nil && *l.ContentTH != "" {
				l.Content = *l.ContentTH
			}
		}

		if _, ok := modulesMap[l.ModuleID]; !ok {
			modulesMap[l.ModuleID] = &models.SqlModuleWithLessons{
				ID:      l.ModuleID,
				Title:   l.ModuleTitle,
				Lessons: []models.SqlLesson{},
			}
			moduleIDs = append(moduleIDs, l.ModuleID)
		}
		modulesMap[l.ModuleID].Lessons = append(modulesMap[l.ModuleID].Lessons, l)
	}

	result := make([]*models.SqlModuleWithLessons, len(moduleIDs))
	for i, id := range moduleIDs {
		result[i] = modulesMap[id]
	}

	helpers.JSON(w, http.StatusOK, result)
}

func (h *SqlPracticeHandler) GetLesson(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id := r.PathValue("id")

	lesson, err := h.repo.GetLessonByID(r.Context(), id, userID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "lesson not found")
		return
	}

	lang := h.getLanguage(r.Context(), userID)
	if lang == "th" {
		if lesson.ModuleTitleTH != nil && *lesson.ModuleTitleTH != "" {
			lesson.ModuleTitle = *lesson.ModuleTitleTH
		}
		if lesson.TitleTH != nil && *lesson.TitleTH != "" {
			lesson.Title = *lesson.TitleTH
		}
		if lesson.DescriptionTH != nil && *lesson.DescriptionTH != "" {
			lesson.Description = *lesson.DescriptionTH
		}
		if lesson.ContentTH != nil && *lesson.ContentTH != "" {
			lesson.Content = *lesson.ContentTH
		}
	}

	helpers.JSON(w, http.StatusOK, lesson)
}

func (h *SqlPracticeHandler) RunLessonQuery(w http.ResponseWriter, r *http.Request) {
	var req struct {
		LessonID string `json:"lesson_id"`
		Query    string `json:"query"`
	}
	if err := helpers.DecodeJSON(r, &req); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	userID := helpers.UserIDFromContext(r.Context())
	lesson, err := h.repo.GetLessonByID(r.Context(), req.LessonID, userID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "lesson not found")
		return
	}

	if err := h.validateQuery(req.Query); err != nil {
		helpers.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Use lesson-specific schema
	result := h.executeAndJudge(r.Context(), lesson.TableSchema, lesson.SeedData, req.Query, lesson.PracticeQuery, false)

	helpers.JSON(w, http.StatusOK, result)
}

func (h *SqlPracticeHandler) CompleteLesson(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id := r.PathValue("id")

	if err := h.repo.UpsertLessonProgress(r.Context(), userID, id, true); err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update progress")
		return
	}

	helpers.JSON(w, http.StatusOK, map[string]string{"status": "success"})
}
