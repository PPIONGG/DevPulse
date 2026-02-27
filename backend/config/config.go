package config

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL       string
	SessionSecret     string
	FrontendURL       string
	GitHubClientID    string
	GitHubSecret      string
	GitHubCallbackURL string
	UploadsDir        string
	Port              string
}

func loadEnvFile() {
	for _, path := range []string{".env", "../.env"} {
		f, err := os.Open(path)
		if err != nil {
			continue
		}
		defer f.Close()
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			k, v, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}
			k = strings.TrimSpace(k)
			v = strings.TrimSpace(v)
			if os.Getenv(k) == "" {
				os.Setenv(k, v)
			}
		}
		return
	}
}

func Load() (*Config, error) {
	loadEnvFile()

	cfg := &Config{
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		SessionSecret:     os.Getenv("SESSION_SECRET"),
		FrontendURL:       getEnvOr("FRONTEND_URL", "http://localhost:3000"),
		GitHubClientID:    os.Getenv("GITHUB_CLIENT_ID"),
		GitHubSecret:      os.Getenv("GITHUB_SECRET"),
		GitHubCallbackURL: os.Getenv("GITHUB_CALLBACK_URL"),
		UploadsDir:        getEnvOr("UPLOADS_DIR", "./uploads"),
		Port:              getEnvOr("PORT", "8080"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.SessionSecret == "" {
		return nil, fmt.Errorf("SESSION_SECRET is required")
	}

	return cfg, nil
}

func getEnvOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
