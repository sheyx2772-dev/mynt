package auth

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// An account directory backed by the test database rather than by a service.
//
// The tests are about sessions and sign-in links, not about where accounts are
// kept — making them depend on a Supabase project would mean they could only
// run for somebody holding its service role key. But the row has to exist:
// `flex_sessions.user_id` references `auth.users`, and a fake that invented an
// id would test a foreign key that production does not have.
type fakeDirectory struct {
	pool *pgxpool.Pool
}

func (f *fakeDirectory) FindOrCreate(ctx context.Context, email string) (Account, error) {
	var account Account

	// Upsert, because signing in twice with one address is a normal thing to do
	// and must give back the same account both times.
	err := f.pool.QueryRow(ctx, `
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
