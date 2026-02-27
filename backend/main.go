package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/thammasornlueadtaharn/devpulse-backend/config"
	"github.com/thammasornlueadtaharn/devpulse-backend/database"
	"github.com/thammasornlueadtaharn/devpulse-backend/database/migrations"
	"github.com/thammasornlueadtaharn/devpulse-backend/handlers"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
	"github.com/thammasornlueadtaharn/devpulse-backend/router"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()

	// Connect to database
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Run migrations
	if err := migrations.Run(ctx, pool); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Create repositories
	userRepo := repository.NewUserRepo(pool)
	sessionRepo := repository.NewSessionRepo(pool)
	profileRepo := repository.NewProfileRepo(pool)
	snippetRepo := repository.NewSnippetRepo(pool)
	calculationRepo := repository.NewCalculationRepo(pool)
	dashboardRepo := repository.NewDashboardRepo(snippetRepo)

	// Create handlers
	authHandler := handlers.NewAuthHandler(
		userRepo, sessionRepo, profileRepo,
		cfg.GitHubClientID, cfg.GitHubSecret, cfg.GitHubCallbackURL, cfg.FrontendURL,
	)
	profileHandler := handlers.NewProfileHandler(profileRepo, cfg.UploadsDir)
	snippetHandler := handlers.NewSnippetHandler(snippetRepo)
	calculationHandler := handlers.NewCalculationHandler(calculationRepo)
	dashboardHandler := handlers.NewDashboardHandler(dashboardRepo)

	// Create router
	handler := router.New(
		authHandler, profileHandler,
		snippetHandler,
		dashboardHandler, calculationHandler,
		sessionRepo, cfg.FrontendURL, cfg.UploadsDir,
	)

	// Start session cleanup goroutine
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			n, err := sessionRepo.DeleteExpired(context.Background())
			if err != nil {
				log.Printf("Session cleanup error: %v", err)
			} else if n > 0 {
				log.Printf("Cleaned up %d expired sessions", n)
			}
		}
	}()

	// Start server
	addr := ":" + cfg.Port
	server := &http.Server{Addr: addr, Handler: handler}

	go func() {
		log.Printf("DevPulse backend starting on %s", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	server.Shutdown(shutdownCtx)
}
