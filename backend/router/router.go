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
	apiPlayground *handlers.ApiPlaygroundHandler,
	timeTracker *handlers.TimeTrackerHandler,
	marketplace *handlers.MarketplaceHandler,
	workflow *handlers.WorkflowHandler,
	dbExplorer *handlers.DatabaseExplorerHandler,
	sqlPractice *handlers.SqlPracticeHandler,
	dashboard *handlers.DashboardHandler,
	calculation *handlers.CalculationHandler,
	admin *handlers.AdminHandler,
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

	mux.Handle("GET /api/api-playground/collections", authMW(http.HandlerFunc(apiPlayground.ListCollections)))
	mux.Handle("POST /api/api-playground/collections", authMW(http.HandlerFunc(apiPlayground.CreateCollection)))
	mux.Handle("PUT /api/api-playground/collections/{id}", authMW(http.HandlerFunc(apiPlayground.UpdateCollection)))
	mux.Handle("DELETE /api/api-playground/collections/{id}", authMW(http.HandlerFunc(apiPlayground.DeleteCollection)))
	mux.Handle("GET /api/api-playground/requests/{id}", authMW(http.HandlerFunc(apiPlayground.GetRequest)))
	mux.Handle("POST /api/api-playground/requests", authMW(http.HandlerFunc(apiPlayground.CreateRequest)))
	mux.Handle("PUT /api/api-playground/requests/{id}", authMW(http.HandlerFunc(apiPlayground.UpdateRequest)))
	mux.Handle("DELETE /api/api-playground/requests/{id}", authMW(http.HandlerFunc(apiPlayground.DeleteRequest)))
	mux.Handle("PATCH /api/api-playground/requests/{id}/move", authMW(http.HandlerFunc(apiPlayground.MoveRequest)))
	mux.Handle("POST /api/api-playground/send", authMW(http.HandlerFunc(apiPlayground.SendRequest)))
	mux.Handle("GET /api/api-playground/history", authMW(http.HandlerFunc(apiPlayground.ListHistory)))
	mux.Handle("DELETE /api/api-playground/history/{id}", authMW(http.HandlerFunc(apiPlayground.DeleteHistoryItem)))
	mux.Handle("DELETE /api/api-playground/history", authMW(http.HandlerFunc(apiPlayground.ClearHistory)))

	// Clients
	mux.Handle("GET /api/clients", authMW(http.HandlerFunc(timeTracker.ListClients)))
	mux.Handle("POST /api/clients", authMW(http.HandlerFunc(timeTracker.CreateClient)))
	mux.Handle("PUT /api/clients/{id}", authMW(http.HandlerFunc(timeTracker.UpdateClient)))
	mux.Handle("DELETE /api/clients/{id}", authMW(http.HandlerFunc(timeTracker.DeleteClient)))

	// Projects
	mux.Handle("GET /api/projects", authMW(http.HandlerFunc(timeTracker.ListProjects)))
	mux.Handle("POST /api/projects", authMW(http.HandlerFunc(timeTracker.CreateProject)))
	mux.Handle("PUT /api/projects/{id}", authMW(http.HandlerFunc(timeTracker.UpdateProject)))
	mux.Handle("PATCH /api/projects/{id}/archive", authMW(http.HandlerFunc(timeTracker.ArchiveProject)))
	mux.Handle("DELETE /api/projects/{id}", authMW(http.HandlerFunc(timeTracker.DeleteProject)))

	// Time entries
	mux.Handle("GET /api/time-entries", authMW(http.HandlerFunc(timeTracker.ListEntries)))
	mux.Handle("GET /api/time-entries/running", authMW(http.HandlerFunc(timeTracker.GetRunning)))
	mux.Handle("POST /api/time-entries/start", authMW(http.HandlerFunc(timeTracker.StartTimer)))
	mux.Handle("POST /api/time-entries/{id}/stop", authMW(http.HandlerFunc(timeTracker.StopTimer)))
	mux.Handle("POST /api/time-entries", authMW(http.HandlerFunc(timeTracker.CreateEntry)))
	mux.Handle("PUT /api/time-entries/{id}", authMW(http.HandlerFunc(timeTracker.UpdateEntry)))
	mux.Handle("DELETE /api/time-entries/{id}", authMW(http.HandlerFunc(timeTracker.DeleteEntry)))
	mux.Handle("GET /api/time-entries/report", authMW(http.HandlerFunc(timeTracker.GetReport)))

	// Invoices
	mux.Handle("GET /api/invoices", authMW(http.HandlerFunc(timeTracker.ListInvoices)))
	mux.Handle("GET /api/invoices/{id}", authMW(http.HandlerFunc(timeTracker.GetInvoice)))
	mux.Handle("POST /api/invoices", authMW(http.HandlerFunc(timeTracker.CreateInvoice)))
	mux.Handle("PUT /api/invoices/{id}", authMW(http.HandlerFunc(timeTracker.UpdateInvoice)))
	mux.Handle("PATCH /api/invoices/{id}/status", authMW(http.HandlerFunc(timeTracker.UpdateInvoiceStatus)))
	mux.Handle("DELETE /api/invoices/{id}", authMW(http.HandlerFunc(timeTracker.DeleteInvoice)))
	mux.Handle("GET /api/invoices/{id}/pdf", authMW(http.HandlerFunc(timeTracker.DownloadPDF)))

	// Marketplace
	mux.Handle("GET /api/marketplace/listings", authMW(http.HandlerFunc(marketplace.BrowseListings)))
	mux.Handle("GET /api/marketplace/listings/{id}", authMW(http.HandlerFunc(marketplace.GetListing)))
	mux.Handle("GET /api/marketplace/my-listings", authMW(http.HandlerFunc(marketplace.MyListings)))
	mux.Handle("POST /api/marketplace/listings", authMW(http.HandlerFunc(marketplace.CreateListing)))
	mux.Handle("PUT /api/marketplace/listings/{id}", authMW(http.HandlerFunc(marketplace.UpdateListing)))
	mux.Handle("DELETE /api/marketplace/listings/{id}", authMW(http.HandlerFunc(marketplace.DeleteListing)))
	mux.Handle("POST /api/marketplace/purchase", authMW(http.HandlerFunc(marketplace.CreatePurchase)))
	mux.Handle("GET /api/marketplace/purchases", authMW(http.HandlerFunc(marketplace.MyPurchases)))
	mux.Handle("GET /api/marketplace/listings/{id}/reviews", authMW(http.HandlerFunc(marketplace.GetReviews)))
	mux.Handle("POST /api/marketplace/listings/{id}/reviews", authMW(http.HandlerFunc(marketplace.CreateReview)))
	mux.Handle("PUT /api/marketplace/reviews/{id}", authMW(http.HandlerFunc(marketplace.UpdateReview)))
	mux.Handle("DELETE /api/marketplace/reviews/{id}", authMW(http.HandlerFunc(marketplace.DeleteReview)))
	mux.Handle("GET /api/marketplace/seller/dashboard", authMW(http.HandlerFunc(marketplace.SellerDashboard)))

	// Workflows
	mux.Handle("GET /api/workflows", authMW(http.HandlerFunc(workflow.List)))
	mux.Handle("GET /api/workflows/{id}", authMW(http.HandlerFunc(workflow.GetByID)))
	mux.Handle("POST /api/workflows", authMW(http.HandlerFunc(workflow.Create)))
	mux.Handle("PUT /api/workflows/{id}", authMW(http.HandlerFunc(workflow.Update)))
	mux.Handle("DELETE /api/workflows/{id}", authMW(http.HandlerFunc(workflow.Delete)))
	mux.Handle("PATCH /api/workflows/{id}/toggle", authMW(http.HandlerFunc(workflow.Toggle)))
	mux.Handle("POST /api/workflows/{id}/run", authMW(http.HandlerFunc(workflow.RunManual)))
	mux.Handle("GET /api/workflows/{workflowId}/runs", authMW(http.HandlerFunc(workflow.ListRuns)))
	mux.Handle("GET /api/workflows/{workflowId}/runs/{runId}", authMW(http.HandlerFunc(workflow.GetRun)))
	mux.Handle("GET /api/workflows/{workflowId}/runs/{runId}/steps", authMW(http.HandlerFunc(workflow.GetStepLogs)))
	mux.HandleFunc("POST /api/webhooks/workflows/{token}", workflow.WebhookTrigger)

	// Database Explorer
	mux.Handle("GET /api/db-explorer/connections", authMW(http.HandlerFunc(dbExplorer.ListConnections)))
	mux.Handle("POST /api/db-explorer/connections", authMW(http.HandlerFunc(dbExplorer.CreateConnection)))
	mux.Handle("PUT /api/db-explorer/connections/{id}", authMW(http.HandlerFunc(dbExplorer.UpdateConnection)))
	mux.Handle("DELETE /api/db-explorer/connections/{id}", authMW(http.HandlerFunc(dbExplorer.DeleteConnection)))
	mux.Handle("POST /api/db-explorer/connections/test", authMW(http.HandlerFunc(dbExplorer.TestConnection)))
	mux.Handle("GET /api/db-explorer/connections/{id}/tables", authMW(http.HandlerFunc(dbExplorer.GetTables)))
	mux.Handle("GET /api/db-explorer/connections/{id}/tables/{table}", authMW(http.HandlerFunc(dbExplorer.GetTableDetail)))
	mux.Handle("POST /api/db-explorer/query", authMW(http.HandlerFunc(dbExplorer.ExecuteQuery)))
	mux.Handle("GET /api/db-explorer/saved-queries", authMW(http.HandlerFunc(dbExplorer.ListSavedQueries)))
	mux.Handle("POST /api/db-explorer/saved-queries", authMW(http.HandlerFunc(dbExplorer.CreateSavedQuery)))
	mux.Handle("PUT /api/db-explorer/saved-queries/{id}", authMW(http.HandlerFunc(dbExplorer.UpdateSavedQuery)))
	mux.Handle("DELETE /api/db-explorer/saved-queries/{id}", authMW(http.HandlerFunc(dbExplorer.DeleteSavedQuery)))
	mux.Handle("GET /api/db-explorer/history", authMW(http.HandlerFunc(dbExplorer.GetHistory)))
	mux.Handle("DELETE /api/db-explorer/history", authMW(http.HandlerFunc(dbExplorer.ClearHistory)))

	// SQL Practice
	mux.Handle("GET /api/sql-practice/challenges", authMW(http.HandlerFunc(sqlPractice.ListChallenges)))
	mux.Handle("GET /api/sql-practice/challenges/{slug}", authMW(http.HandlerFunc(sqlPractice.GetChallenge)))
	mux.Handle("POST /api/sql-practice/submit", authMW(http.HandlerFunc(sqlPractice.SubmitAnswer)))
	mux.Handle("POST /api/sql-practice/run", authMW(http.HandlerFunc(sqlPractice.RunQuery)))
	mux.Handle("GET /api/sql-practice/stats", authMW(http.HandlerFunc(sqlPractice.GetStats)))
	mux.Handle("GET /api/sql-practice/submissions/{challengeId}", authMW(http.HandlerFunc(sqlPractice.ListSubmissions)))
	mux.Handle("GET /api/sql-practice/challenges/{slug}/preview/{tableName}", authMW(http.HandlerFunc(sqlPractice.PreviewTable)))
	mux.Handle("POST /api/sql-practice/explain", authMW(http.HandlerFunc(sqlPractice.ExplainQuery)))
	mux.Handle("GET /api/sql-practice/top-solutions/{challengeId}", authMW(http.HandlerFunc(sqlPractice.ListTopSolutions)))

	// Academy
	mux.Handle("GET /api/sql-practice/lessons", authMW(http.HandlerFunc(sqlPractice.ListLessons)))
	mux.Handle("GET /api/sql-practice/lessons/{id}", authMW(http.HandlerFunc(sqlPractice.GetLesson)))
	mux.Handle("POST /api/sql-practice/lessons/run", authMW(http.HandlerFunc(sqlPractice.RunLessonQuery)))
	mux.Handle("POST /api/sql-practice/lessons/{id}/complete", authMW(http.HandlerFunc(sqlPractice.CompleteLesson)))

	mux.Handle("GET /api/dashboard/stats", authMW(http.HandlerFunc(dashboard.Stats)))
	mux.Handle("GET /api/dashboard/recent", authMW(http.HandlerFunc(dashboard.Recent)))

	mux.Handle("GET /api/calculations", authMW(http.HandlerFunc(calculation.List)))
	mux.Handle("POST /api/calculations", authMW(http.HandlerFunc(calculation.Create)))
	mux.Handle("DELETE /api/calculations/{id}", authMW(http.HandlerFunc(calculation.Delete)))
	mux.Handle("DELETE /api/calculations", authMW(http.HandlerFunc(calculation.ClearAll)))

	// Admin & System
	mux.Handle("GET /api/admin/navigation", authMW(middleware.AdminOnly(http.HandlerFunc(admin.ListNavigation))))
	mux.Handle("PATCH /api/admin/navigation/{id}/toggle", authMW(middleware.AdminOnly(http.HandlerFunc(admin.ToggleNavigationVisibility))))
	mux.Handle("GET /api/navigation", authMW(http.HandlerFunc(admin.GetVisibleNavigation)))

	// Apply global middleware
	var handler http.Handler = mux
	handler = middleware.JSONContentType(handler)
	handler = middleware.CORS(frontendURL)(handler)
	handler = middleware.Logger(handler)

	return handler
}
