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

	// Where the browser-facing site lives. Sign-in links are built from this
	// and never from a request header: a Host an attacker controls would
	// otherwise end up inside a one-time link mailed to a victim.
	SiteURL string

	// Sending account for the sign-in mail. Empty means no provider is
	// configured, and in development the link is written to the log instead.
	ResendAPIKey string
	MailFrom     string

	// Whether X-Forwarded-For may be believed.
	//
	// Off by default, because a client can put anything in that header. Believing
	// it without a proxy in front means every rate limit in the system can be
	// stepped around by sending a different number each time. Turn it on only
	// when something trusted — Caddy, nginx, a load balancer — sets it.
	TrustProxy bool

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
		SiteURL:      withDefault("SITE_URL", "https://flex.com.uz"),
		ResendAPIKey: os.Getenv("RESEND_API_KEY"),
		MailFrom:     withDefault("MAIL_FROM", "Flex <kirish@flex.com.uz>"),
		TrustProxy:   os.Getenv("TRUST_PROXY") == "true",
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	// A production deployment with no mail provider cannot sign anybody in, and
	// the fallback writes live sign-in links to the log. Better to refuse to
	// start than to run in a state where the only way in is reading a log file.
	if !cfg.IsDevelopment() && cfg.ResendAPIKey == "" {
		missing = append(missing, "RESEND_API_KEY")
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
