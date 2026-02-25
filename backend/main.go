package main

import (
	"log"
	"net/http"

	"github.com/thammasornlueadtaharn/devpulse-backend/handlers"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handlers.HealthCheck)

	addr := ":8080"
	log.Printf("DevPulse backend starting on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
