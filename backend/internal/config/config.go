// Package config reads what the process needs from its environment, once, at
// start-up.
//
// Nothing else in the backend reads an environment variable. A value that is
// missing or malformed stops the process here, at boot, with a sentence saying
// which one — rather than surfacing as a nil pointer inside a request handler
// at three in the morning. A server that cannot do its job should refuse to
// start rather than start and refuse its callers.
package config

import (
	"fmt"
	"os"
	"strings"
	"time"
)

type Config struct {
	// Where Postgres is. Required: there is no useful degraded mode for a
	// backend whose only job is to answer questions about a database.
	DatabaseURL string

	// The address the HTTP server listens on, as ":8080".
	Addr string

	// "development" or "production". Development is the exception that has to
	// be asked for; anything unrecognised is treated as production, so a typo
	// tightens the server rather than loosening it.
	Env string

	// How long a request may take before the server gives up on it.
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

func (c Config) IsDevelopment() bool { return c.Env == "development" }

// Load builds the configuration, or explains what is missing.
func Load() (Config, error) {
	cfg := Config{
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		Addr:         withDefault("ADDR", ":8080"),
		Env:          normaliseEnv(os.Getenv("APP_ENV")),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("sozlama yetishmayapti: %s", strings.Join(missing, ", "))
	}

	return cfg, nil
}

func withDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func normaliseEnv(raw string) string {
	if strings.EqualFold(raw, "development") || strings.EqualFold(raw, "dev") {
		return "development"
	}
	return "production"
}
