package auth

import (
	"context"
	"errors"
	"net/netip"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Signing in with a password.
//
// The fast door, for the handful of people who open the panel every day. The
// link stays and is still how an account is created and how one is recovered —
// a forgotten password must not be a locked door, and there is no reset flow
// because the link already is one.
//
// Tighter limits than anywhere else in this system. A password is guessable
// where a token is not, so ten attempts an hour against an address or a source,
// counted whether they succeed or not.
const (
	passwordAttemptsPerHour = 10
	passwordWindow          = time.Hour
)

// SignInWithPassword returns a session token, or ErrBadPassword.
//
// One error for "no such account", "no password set" and "wrong password". They
// are three different facts and telling them apart tells somebody which
// addresses have accounts.
func (s *Service) SignInWithPassword(ctx context.Context, email, password, userAgent string, ip *netip.Addr) (string, Account, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	allowed, err := s.passwordAttemptsLeft(ctx, email, ip)
	if err != nil {
		return "", Account{}, err
	}
	if !allowed {
		s.recordPasswordAttempt(ctx, email, ip, false)
		return "", Account{}, ErrRateLimited
	}

	row, err := s.queries.PasswordFor(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		s.recordPasswordAttempt(ctx, email, ip, false)
		// Hashed anyway, against a throwaway, so a missing account and a wrong
		// password take the same time. Otherwise the difference is a way to ask
		// which addresses exist.
		_ = VerifyPassword(password, decoyHash)
		return "", Account{}, ErrBadPassword
	}
	if err != nil {
		return "", Account{}, err
	}

	if !VerifyPassword(password, row.Hash) {
		s.recordPasswordAttempt(ctx, email, ip, false)
		return "", Account{}, ErrBadPassword
	}

	s.recordPasswordAttempt(ctx, email, ip, true)

	account := Account{ID: row.UserID.String(), Verified: true}
	if row.Email != nil {
		account.Email = *row.Email
	}

	token, err := s.issueSession(ctx, row.UserID, userAgent, ip)
	return token, account, err
}

// SetPassword stores a new one for an account that is already signed in.
//
// Deliberately not a reset flow: whoever calls this has proved who they are, by
// a link or by their current password. A reset that starts from an address is
// the link, which already exists.
func (s *Service) SetPassword(ctx context.Context, userID, password string) error {
	id, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	hash, err := HashPassword(password)
	if err != nil {
		return err
	}

	return s.queries.SetPassword(ctx, store.SetPasswordParams{UserID: id, Hash: hash})
}

func (s *Service) passwordAttemptsLeft(ctx context.Context, email string, ip *netip.Addr) (bool, error) {
	count, err := s.queries.CountRecentPasswordAttempts(ctx, store.CountRecentPasswordAttemptsParams{
		Email:         &email,
		Ip:            ip,
		WindowSeconds: int32(passwordWindow.Seconds()),
	})
	if err != nil {
		return false, err
	}
	return count < passwordAttemptsPerHour, nil
}

func (s *Service) recordPasswordAttempt(ctx context.Context, email string, ip *netip.Addr, ok bool) {
	_ = s.queries.RecordPasswordAttempt(ctx, store.RecordPasswordAttemptParams{
		Email: &email, Ip: ip, Succeeded: ok,
	})
}

// A real hash of a value nobody knows, so that verifying against a missing
// account costs what verifying against a real one costs.
const decoyHash = "$argon2id$v=19$m=65536,t=1,p=4$" +
	"c2FsdHNhbHRzYWx0c2E$" +
	"aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhcw"
