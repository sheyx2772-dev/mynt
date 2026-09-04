// Package database opens the one connection pool the process uses.
//
// Every query in the backend goes through this pool. pgx is used directly
// rather than through database/sql: the Postgres wire protocol supports
// prepared statements, binary results and types that database/sql's lowest
// common denominator flattens, and this is a Postgres application — there is
// no second database to stay portable for.
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool limits.
//
// Postgres serves each connection with a process of its own, so a pool that is
// too large does not go faster — it makes the database do more bookkeeping for
// the same work. Twenty five is generous for one application server and stays
// well inside the default max_connections of a hundred, leaving room for a
// migration run and a psql session to get in alongside it.
const (
	maxConns        = 25
	minConns        = 2
	maxConnLifetime = time.Hour
	maxConnIdleTime = 5 * time.Minute
	connectTimeout  = 10 * time.Second
)

// Connect opens the pool and proves it works before returning it.
//
// pgxpool is lazy: it hands back a pool that has opened nothing, so a wrong
// password or an unreachable host would otherwise surface on the first request
// rather than at boot. The ping is what makes a bad DATABASE_URL a start-up
// failure.
func Connect(ctx context.Context, url string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		// The URL holds a password, so it is never included in the message.
		return nil, fmt.Errorf("DATABASE_URL o'qilmadi: %w", err)
	}

	cfg.MaxConns = maxConns
	cfg.MinConns = minConns
	cfg.MaxConnLifetime = maxConnLifetime
	cfg.MaxConnIdleTime = maxConnIdleTime

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("bazaga ulanib bo'lmadi: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, connectTimeout)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("baza javob bermadi: %w", err)
	}

	return pool, nil
}
