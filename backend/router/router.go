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
	workLog *handlers.WorkLogHandler,
	article *handlers.ArticleHandler,
	bookmark *handlers.BookmarkHandler,
	dashboard *handlers.DashboardHandler,
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
	mux.Handle("PUT /api/snippets/{id}", authMW(http.HandlerFunc(snippet.Update)))
	mux.Handle("DELETE /api/snippets/{id}", authMW(http.HandlerFunc(snippet.Delete)))

	mux.Handle("GET /api/work-logs", authMW(http.HandlerFunc(workLog.List)))
	mux.Handle("POST /api/work-logs", authMW(http.HandlerFunc(workLog.Create)))
	mux.Handle("PUT /api/work-logs/{id}", authMW(http.HandlerFunc(workLog.Update)))
	mux.Handle("DELETE /api/work-logs/{id}", authMW(http.HandlerFunc(workLog.Delete)))

	mux.Handle("GET /api/articles", authMW(http.HandlerFunc(article.List)))
	mux.Handle("POST /api/articles", authMW(http.HandlerFunc(article.Create)))
	mux.Handle("PUT /api/articles/{id}", authMW(http.HandlerFunc(article.Update)))
	mux.Handle("DELETE /api/articles/{id}", authMW(http.HandlerFunc(article.Delete)))

	mux.Handle("GET /api/bookmarks", authMW(http.HandlerFunc(bookmark.List)))
	mux.Handle("POST /api/bookmarks", authMW(http.HandlerFunc(bookmark.Create)))
	mux.Handle("PUT /api/bookmarks/{id}", authMW(http.HandlerFunc(bookmark.Update)))
	mux.Handle("DELETE /api/bookmarks/{id}", authMW(http.HandlerFunc(bookmark.Delete)))

	mux.Handle("GET /api/dashboard/stats", authMW(http.HandlerFunc(dashboard.Stats)))
	mux.Handle("GET /api/dashboard/recent", authMW(http.HandlerFunc(dashboard.Recent)))

	// Apply global middleware
	var handler http.Handler = mux
	handler = middleware.JSONContentType(handler)
	handler = middleware.CORS(frontendURL)(handler)
	handler = middleware.Logger(handler)

	return handler
}
