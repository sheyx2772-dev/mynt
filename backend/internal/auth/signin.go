package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/netip"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/mail"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Signing in: asking for a link, and spending it.

// RequestLink mails a sign-in link, if the caller is allowed one.
//
// It returns nil when the address is refused for rate limiting, and the caller
// answers the same way it answers success. That is the point: an endpoint that
// says "too many attempts for this address" and "sent" differently is an
// endpoint that answers whether an address has an account here, which is not
// ours to disclose about our own customers.
func (s *Service) RequestLink(ctx context.Context, email string, ip *netip.Addr) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if len(email) > 254 || !emailPattern.MatchString(email) {
		return ErrInvalidEmail
	}

	allowed, err := s.withinRateLimit(ctx, email, ip)
	if err != nil {
		return err
	}
	if !allowed {
		// Logged, because a person reporting that no link arrived needs
		// somebody to be able to see why. Not returned.
		slog.Info("kirish havolasi cheklandi", "email", email)
		return nil
	}

	token, hash, err := NewToken()
	if err != nil {
		return err
	}

	if _, err := s.queries.CreateLoginToken(ctx, store.CreateLoginTokenParams{
		Email:     email,
		TokenHash: hash,
		ExpiresAt: timestamp(time.Now().Add(LinkLifetime)),
		Ip:        ip,
	}); err != nil {
		return fmt.Errorf("havola yozilmadi: %w", err)
	}

	// The link goes to a page, which posts the token back. A GET that spends
	// the token would be spent by the first mail scanner that follows links
	// for safety — and those run before the person ever sees the message.
	link := fmt.Sprintf("%s/kirish/tasdiq?t=%s", s.siteURL, token)

	return s.mailer.Send(ctx, mail.Message{
		To:      email,
		Subject: "Flex — kirish havolasi",
		Body: fmt.Sprintf(
			"Kirish uchun shu havolani oching:\n\n%s\n\n"+
				"Havola 15 daqiqa amal qiladi va bir marta ishlaydi.\n"+
				"Agar buni siz so'ramagan bo'lsangiz, xatni e'tiborsiz qoldiring.\n",
			link,
		),
	})
}

func (s *Service) withinRateLimit(ctx context.Context, email string, ip *netip.Addr) (bool, error) {
	window := int32(rateWindow.Seconds())

	byEmail, err := s.queries.CountRecentLoginTokens(ctx, store.CountRecentLoginTokensParams{
		Email:         email,
		WindowSeconds: window,
	})
	if err != nil {
		return false, err
	}
	if byEmail >= linksPerEmailPerHour {
		return false, nil
	}

	// An address is not always known: a request through a proxy that strips it,
	// or a unix socket, has none. Missing means unlimited by this window rather
	// than blocked by it — the per-address window still applies.
	if ip == nil {
		return true, nil
	}

	bySource, err := s.queries.CountRecentLoginTokensByIP(ctx, store.CountRecentLoginTokensByIPParams{
		Ip:            ip,
		WindowSeconds: window,
	})
	if err != nil {
		return false, err
	}

	return bySource < linksPerIPPerHour, nil
}

// ConsumeLink spends a sign-in link and returns a session token for it.
//
// The whole thing is one transaction. Halfway through — link spent, session not
// created — is a person who followed a valid link, is not signed in, and cannot
// use the link again.
func (s *Service) ConsumeLink(ctx context.Context, linkToken, userAgent string, ip *netip.Addr) (string, Account, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return "", Account{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := s.queries.WithTx(tx)

	// The update that reads it also spends it, so two requests racing with the
	// same token produce one session and one failure rather than two sessions.
	link, err := q.ConsumeLoginToken(ctx, HashToken(linkToken))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", Account{}, ErrBadToken
		}
		return "", Account{}, err
	}

	// Following a link proves the address, so an account is made here rather
	// than at the point somebody typed it. Nothing exists for an address that
	// was only ever entered into a form.
	account, err := q.UserByEmail(ctx, link.Email)
	if errors.Is(err, pgx.ErrNoRows) {
		account, err = q.CreateUser(ctx, link.Email)
	}
	if err != nil {
		return "", Account{}, err
	}

	if err := q.MarkEmailVerified(ctx, account.ID); err != nil {
		return "", Account{}, err
	}

	sessionToken, hash, err := NewToken()
	if err != nil {
		return "", Account{}, err
	}

	var agent *string
	if trimmed := truncate(userAgent, 400); trimmed != "" {
		agent = &trimmed
	}

	if _, err := q.CreateSession(ctx, store.CreateSessionParams{
		UserID:    account.ID,
		TokenHash: hash,
		ExpiresAt: timestamp(time.Now().Add(SessionLifetime)),
		UserAgent: agent,
		Ip:        ip,
	}); err != nil {
		return "", Account{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", Account{}, err
	}

	return sessionToken, Account{
		ID:       account.ID.String(),
		Email:    account.Email,
		Verified: true,
	}, nil
}
