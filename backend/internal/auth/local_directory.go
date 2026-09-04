package auth

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// An account directory for development, which writes straight to the database.
//
// The same argument as the log mailer beside it: development should not need
// somebody's Supabase project, and a person cloning this repository should be
// able to sign in within a minute of `make schema`. `make schema` builds a
// local copy of the real schema including the `auth` tables, so there is a
// place to put an account.
//
// It is chosen only when no Supabase project is configured, and `config.Load`
// refuses to start a production process in that state — because an account
// directory that anybody with a database connection can write to is the whole
// authentication system, and it belongs nowhere near real customers.
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
