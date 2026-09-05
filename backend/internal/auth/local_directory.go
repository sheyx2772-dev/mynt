package auth

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// The account directory: a table in this database.
//
// It was written as the development stand-in for a Supabase project, and it is
// the only one now — which changed nothing about it. What changed is that
// nothing else can write to `auth.users`. When accounts lived behind an admin
// API, the key that reached it also reached every row in every table; the door
// is one function in one process now, and everything on the other side of it
// goes through a session this package issued.
//
// The table keeps the name `auth.users` because the queries that read it
// number in the dozens and renaming it is a migration, not a decision — the
// schema is ours either way.
type LocalDirectory struct {
	pool *pgxpool.Pool
}

func NewLocalDirectory(pool *pgxpool.Pool) *LocalDirectory {
	return &LocalDirectory{pool: pool}
}

func (d *LocalDirectory) FindOrCreate(ctx context.Context, email string) (Account, error) {
	var account Account

	// Upsert rather than select-then-insert: signing in twice with one address
	// is a normal thing to do and must give back the same account both times,
	// including when two requests arrive together.
	err := d.pool.QueryRow(ctx, `
		insert into auth.users (email) values ($1)
		on conflict (email) do update set email = excluded.email
		returning id::text, email
	`, email).Scan(&account.ID, &account.Email)
	if err != nil {
		return Account{}, err
	}

	account.Verified = true
	return account, nil
}
