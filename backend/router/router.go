package router

import (
	"net/http"

	"github.com/thammasornlueadtaharn/devpulse-backend/handlers"
	"github.com/thammasornlueadtaharn/devpulse-backend/middleware"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

func New(
	auth *handlers.AuthHandler,
	profile *handlers.ProfileHandler,
	snippet *handlers.SnippetHandler,
	expense *handlers.ExpenseHandler,
	habit *handlers.HabitHandler,
	kanban *handlers.KanbanHandler,
	pomodoro *handlers.PomodoroHandler,
	envVault *handlers.EnvVaultHandler,
	jsonDoc *handlers.JsonDocumentHandler,
	dashboard *handlers.DashboardHandler,
	calculation *handlers.CalculationHandler,
	sessionRepo *repository.SessionRepo,
	frontendURL string,
	uploadsDir string,
) http.Handler {
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("GET /health", handlers.HealthCheck)

	// Public auth routes
	mux.HandleFunc("POST /api/auth/register", auth.Register)
	mux.HandleFunc("POST /api/auth/login", auth.Login)
	mux.HandleFunc("POST /api/auth/logout", auth.Logout)
	mux.HandleFunc("GET /api/auth/github", auth.GitHubRedirect)
	mux.HandleFunc("GET /api/auth/github/callback", auth.GitHubCallback)

	// Static file serving for uploads
	fs := http.FileServer(http.Dir(uploadsDir))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

	// Protected routes - wrap with auth middleware
	authMW := middleware.Auth(sessionRepo)

	mux.Handle("GET /api/auth/me", authMW(http.HandlerFunc(auth.Me)))

	mux.Handle("GET /api/profile", authMW(http.HandlerFunc(profile.Get)))
	mux.Handle("PUT /api/profile", authMW(http.HandlerFunc(profile.Update)))
	mux.Handle("POST /api/profile/avatar", authMW(http.HandlerFunc(profile.UploadAvatar)))

	mux.Handle("GET /api/snippets", authMW(http.HandlerFunc(snippet.List)))
	mux.Handle("GET /api/snippets/shared", authMW(http.HandlerFunc(snippet.ListShared)))
	mux.Handle("POST /api/snippets", authMW(http.HandlerFunc(snippet.Create)))
	mux.Handle("POST /api/snippets/copy/{id}", authMW(http.HandlerFunc(snippet.Copy)))
	mux.Handle("PUT /api/snippets/{id}", authMW(http.HandlerFunc(snippet.Update)))
	mux.Handle("DELETE /api/snippets/{id}", authMW(http.HandlerFunc(snippet.Delete)))

	mux.Handle("GET /api/expenses", authMW(http.HandlerFunc(expense.List)))
	mux.Handle("POST /api/expenses", authMW(http.HandlerFunc(expense.Create)))
	mux.Handle("PUT /api/expenses/{id}", authMW(http.HandlerFunc(expense.Update)))
	mux.Handle("DELETE /api/expenses/{id}", authMW(http.HandlerFunc(expense.Delete)))

	mux.Handle("GET /api/habits", authMW(http.HandlerFunc(habit.List)))
	mux.Handle("POST /api/habits", authMW(http.HandlerFunc(habit.Create)))
	mux.Handle("PUT /api/habits/{id}", authMW(http.HandlerFunc(habit.Update)))
	mux.Handle("PATCH /api/habits/{id}/archive", authMW(http.HandlerFunc(habit.Archive)))
	mux.Handle("DELETE /api/habits/{id}", authMW(http.HandlerFunc(habit.Delete)))
	mux.Handle("GET /api/habits/completions", authMW(http.HandlerFunc(habit.GetCompletions)))
	mux.Handle("POST /api/habits/{id}/toggle", authMW(http.HandlerFunc(habit.ToggleCompletion)))

	mux.Handle("GET /api/kanban/boards", authMW(http.HandlerFunc(kanban.ListBoards)))
	mux.Handle("POST /api/kanban/boards", authMW(http.HandlerFunc(kanban.CreateBoard)))
	mux.Handle("GET /api/kanban/boards/{id}", authMW(http.HandlerFunc(kanban.GetBoard)))
	mux.Handle("PUT /api/kanban/boards/{id}", authMW(http.HandlerFunc(kanban.UpdateBoard)))
	mux.Handle("DELETE /api/kanban/boards/{id}", authMW(http.HandlerFunc(kanban.DeleteBoard)))
	mux.Handle("POST /api/kanban/boards/{boardId}/columns", authMW(http.HandlerFunc(kanban.CreateColumn)))
	mux.Handle("PUT /api/kanban/columns/{colId}", authMW(http.HandlerFunc(kanban.UpdateColumn)))
	mux.Handle("DELETE /api/kanban/columns/{colId}", authMW(http.HandlerFunc(kanban.DeleteColumn)))
	mux.Handle("POST /api/kanban/columns/{colId}/cards", authMW(http.HandlerFunc(kanban.CreateCard)))
	mux.Handle("PUT /api/kanban/cards/{cardId}", authMW(http.HandlerFunc(kanban.UpdateCard)))
	mux.Handle("DELETE /api/kanban/cards/{cardId}", authMW(http.HandlerFunc(kanban.DeleteCard)))
	mux.Handle("PUT /api/kanban/cards/reorder", authMW(http.HandlerFunc(kanban.ReorderCards)))

	mux.Handle("GET /api/pomodoro/sessions", authMW(http.HandlerFunc(pomodoro.List)))
	mux.Handle("POST /api/pomodoro/sessions", authMW(http.HandlerFunc(pomodoro.Create)))
	mux.Handle("DELETE /api/pomodoro/sessions/{id}", authMW(http.HandlerFunc(pomodoro.Delete)))
	mux.Handle("DELETE /api/pomodoro/sessions", authMW(http.HandlerFunc(pomodoro.ClearAll)))
	mux.Handle("GET /api/pomodoro/stats", authMW(http.HandlerFunc(pomodoro.Stats)))

	mux.Handle("GET /api/env-vaults", authMW(http.HandlerFunc(envVault.List)))
	mux.Handle("GET /api/env-vaults/{id}", authMW(http.HandlerFunc(envVault.Get)))
	mux.Handle("POST /api/env-vaults", authMW(http.HandlerFunc(envVault.Create)))
	mux.Handle("PUT /api/env-vaults/{id}", authMW(http.HandlerFunc(envVault.Update)))
	mux.Handle("DELETE /api/env-vaults/{id}", authMW(http.HandlerFunc(envVault.Delete)))
	mux.Handle("POST /api/env-vaults/{id}/variables", authMW(http.HandlerFunc(envVault.AddVariable)))
	mux.Handle("PUT /api/env-variables/{id}", authMW(http.HandlerFunc(envVault.UpdateVariable)))
	mux.Handle("DELETE /api/env-variables/{id}", authMW(http.HandlerFunc(envVault.DeleteVariable)))
	mux.Handle("POST /api/env-vaults/{id}/import", authMW(http.HandlerFunc(envVault.Import)))

	mux.Handle("GET /api/json-documents", authMW(http.HandlerFunc(jsonDoc.List)))
	mux.Handle("POST /api/json-documents", authMW(http.HandlerFunc(jsonDoc.Create)))
	mux.Handle("PUT /api/json-documents/{id}", authMW(http.HandlerFunc(jsonDoc.Update)))
	mux.Handle("DELETE /api/json-documents/{id}", authMW(http.HandlerFunc(jsonDoc.Delete)))

	mux.Handle("GET /api/dashboard/stats", authMW(http.HandlerFunc(dashboard.Stats)))
	mux.Handle("GET /api/dashboard/recent", authMW(http.HandlerFunc(dashboard.Recent)))

	mux.Handle("GET /api/calculations", authMW(http.HandlerFunc(calculation.List)))
	mux.Handle("POST /api/calculations", authMW(http.HandlerFunc(calculation.Create)))
	mux.Handle("DELETE /api/calculations/{id}", authMW(http.HandlerFunc(calculation.Delete)))
	mux.Handle("DELETE /api/calculations", authMW(http.HandlerFunc(calculation.ClearAll)))

	// Apply global middleware
	var handler http.Handler = mux
	handler = middleware.JSONContentType(handler)
	handler = middleware.CORS(frontendURL)(handler)
	handler = middleware.Logger(handler)

	return handler
}
