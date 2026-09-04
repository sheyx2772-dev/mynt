package auth

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

// Using a session, and ending one.

// Authenticate turns a session token into whoever holds it.
//
// Expiry is decided by the statement, not here. Two places deciding what "still
// valid" means eventually disagree, and the one that is wrong is the one that
// lets somebody in.
func (s *Service) Authenticate(ctx context.Context, sessionToken string) (Account, error) {
	if sessionToken == "" {
		return Account{}, ErrNoSession
	}

	row, err := s.queries.TouchSession(ctx, HashToken(sessionToken))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Account{}, ErrNoSession
		}
		return Account{}, err
	}

	return Account{
		ID:       row.UserID.String(),
		Email:    row.Email,
		Verified: row.EmailVerifiedAt.Valid,
	}, nil
}

// SignOut ends one session — this device, not the others.
func (s *Service) SignOut(ctx context.Context, sessionToken string) error {
	if sessionToken == "" {
		return nil
	}
	return s.queries.DeleteSession(ctx, HashToken(sessionToken))
}
