package database

import (
	"context"
	"embed"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

// The schema, carried inside the binary.
//
// A container has no repository to read migrations from, so they ship with the
// program that needs them. That also makes the pair inseparable: a binary and
// the schema it was written against arrive together, and there is no deploy
// where one is newer than the other.
//
//go:embed migrations/*.sql
var migrations embed.FS

// Migrate brings the database up to the schema this binary expects.
//
// Run at startup, before anything serves. Applying them by hand is a step
// somebody forgets, and the way it is discovered is a customer hitting a table
// that does not exist — which is exactly how this was found: the stack came up
// clean, every container healthy, and not one table in the database.
//
// Only ever forwards. An older binary rolled back onto a newer database finds
// nothing to apply and starts anyway, which is what makes rolling back safe.
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	goose.SetBaseFS(migrations)
	goose.SetLogger(goose.NopLogger())

	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("goose dialecti: %w", err)
	}

	// goose speaks database/sql, and the pool is pgx. This borrows one
	// connection from the pool rather than opening a second route to the
	// database with its own settings.
	db := stdlib.OpenDBFromPool(pool)
	defer db.Close()

	before, err := goose.GetDBVersionContext(ctx, db)
	if err != nil {
		return fmt.Errorf("joriy versiya o'qilmadi: %w", err)
	}

	if err := goose.UpContext(ctx, db, "migrations"); err != nil {
		return fmt.Errorf("migratsiya: %w", err)
	}

	after, err := goose.GetDBVersionContext(ctx, db)
	if err != nil {
		return fmt.Errorf("yangi versiya o'qilmadi: %w", err)
	}

	if after != before {
		slog.Info("migratsiya qo'llandi", "oldin", before, "keyin", after)
	}
	return nil
}
