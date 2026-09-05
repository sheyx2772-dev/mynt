// The Flex backend.
//
// One process: an HTTP server in front of one Postgres database. It is the only
// thing that talks to that database, which is what makes it the place where a
// rule about the data can be written once and hold for the website, the phone
// and the admin panel at the same time.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/sheyx2772-dev/flex/backend/internal/api"
	"github.com/sheyx2772-dev/flex/backend/internal/auth"
	"github.com/sheyx2772-dev/flex/backend/internal/config"
	"github.com/sheyx2772-dev/flex/backend/internal/database"
	"github.com/sheyx2772-dev/flex/backend/internal/mail"
	"github.com/sheyx2772-dev/flex/backend/internal/sms"
)

// How long a shutdown waits for requests already in flight. Longer than any
// request should take and shorter than the fifteen seconds most orchestrators
// allow before they stop asking and start killing.
const shutdownGrace = 10 * time.Second

func main() {
	if err := run(); err != nil {
		slog.Error("ishga tushmadi", "xato", err)
		os.Exit(1)
	}
}

func run() error {
	// A .env file is a development convenience. In production the environment
	// is set by whatever runs the container, and a missing file is not an
	// error — which is why this return value is deliberately ignored.
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	logger := newLogger(cfg)
	slog.SetDefault(logger)

	// Cancelled by the first SIGINT or SIGTERM. Everything below takes this
	// context, so one signal unwinds the whole process in order.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	authService := auth.NewService(pool, newMailer(cfg), newTexter(cfg), auth.NewLocalDirectory(pool), cfg.SiteURL)

	// Housekeeping, on the same context as everything else — one signal stops
	// it with the rest.
	go authService.Sweep(ctx)

	server := &http.Server{
		Addr:    cfg.Addr,
		Handler: api.New(cfg, pool, authService),
		// A client that opens a connection and then says nothing holds a
		// goroutine and a file descriptor for as long as it likes. These are
		// the deadlines that make that a bounded problem.
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       60 * time.Second,
	}

	// The server runs on its own goroutine so this one can wait on the signal.
	// A failure to bind the port has to reach `run`, hence the channel.
	failed := make(chan error, 1)
	go func() {
		slog.Info("tinglayapti", "manzil", cfg.Addr, "muhit", cfg.Env)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			failed <- err
		}
	}()

	select {
	case err := <-failed:
		return err
	case <-ctx.Done():
	}

	slog.Info("to'xtatilyapti")

	// A fresh context: the one above is already cancelled, and a shutdown that
	// inherits a cancelled context stops instantly and drops the requests it
	// was supposed to be waiting for.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownGrace)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return err
	}

	slog.Info("to'xtadi")
	return nil
}

// newMailer picks how sign-in links go out.
//
// With no provider configured the links are written to the log, which is what
// development wants — no account, no key, no waiting. It is announced loudly
// because a log holding live sign-in tokens is a log that grants accounts, and
// `config.Load` refuses to start a production process in this state at all.
func newMailer(cfg config.Config) mail.Mailer {
	if cfg.ResendAPIKey == "" {
		slog.Warn("pochta xizmati sozlanmagan — kirish havolalari jurnalga yoziladi")
		return mail.LogMailer{}
	}
	return mail.NewResend(cfg.ResendAPIKey, cfg.MailFrom)
}

// newTexter picks how sign-in codes go out.
//
// With no provider configured they are written to the log, which development
// wants and production must never do — `config.Load` refuses to start a
// production process in that state.
func newTexter(cfg config.Config) sms.Sender {
	if cfg.EskizEmail == "" {
		slog.Warn("SMS xizmati sozlanmagan — kodlar jurnalga yoziladi")
		return sms.LogSender{}
	}
	return sms.NewEskiz(cfg.EskizEmail, cfg.EskizPassword, cfg.SMSFrom)
}

// Text for a person reading a terminal, JSON for a machine reading a log file.
func newLogger(cfg config.Config) *slog.Logger {
	if cfg.IsDevelopment() {
		return slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
}
