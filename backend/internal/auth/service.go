package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/netip"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/mail"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// How long each secret lives.
//
// A sign-in link is short because it arrives by mail, and mail sits in places
// its owner does not control — a shared laptop, a synced inbox, a scanner at a
// company gateway. Fifteen minutes is long enough to walk to a computer.
//
// A session is long because the alternative is asking somebody to check their
// mail every week to use an app they have already proved they own. Thirty days
// from issue, absolute: it does not slide, so a stolen session ends on a known
// date rather than living forever by being used.
const (
	LinkLifetime    = 15 * time.Minute
	SessionLifetime = 30 * 24 * time.Hour
)

// Two windows, both an hour. One address may be sent few links; one source may
// ask for more, because an office behind one address is several people.
const (
	linksPerEmailPerHour = 5
	linksPerIPPerHour    = 20
	rateWindow           = time.Hour
)

// Deliberately loose. This is not the check that matters — the check that
// matters is whether a link sent to the address is followed — and a stricter
// pattern rejects real addresses, which is a worse failure than accepting an
// unreachable one.
var emailPattern = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

var (
	// ErrInvalidEmail is the only reason a sign-in request is refused in a way
	// the caller is told about.
	ErrInvalidEmail = errors.New("email manzil noto'g'ri")
	// ErrRateLimited is deliberately not distinguished from success to the
	// caller — see RequestLink.
	ErrRateLimited = errors.New("juda ko'p urinish")
	// ErrBadToken covers a link that never existed, has expired, or has been
	// used. One error for all three: telling them apart tells somebody holding
	// a guessed token which half of the guess was right.
	ErrBadToken = errors.New("havola yaroqsiz")
	// ErrNoSession is what an unauthenticated request produces.
	ErrNoSession = errors.New("sessiya yo'q")
)

type Service struct {
	pool    *pgxpool.Pool
	queries *store.Queries
	mailer  mail.Mailer
	// Where a sign-in link points. Configuration rather than a request header:
	// a Host an attacker controls would otherwise end up inside a link mailed
	// to a victim, pointing their one-time token at a server the attacker owns.
	siteURL string
}

func NewService(pool *pgxpool.Pool, mailer mail.Mailer, siteURL string) *Service {
	return &Service{
		pool:    pool,
		queries: store.New(pool),
		mailer:  mailer,
		siteURL: strings.TrimSuffix(siteURL, "/"),
	}
}

// Account is who a request turned out to be from.
type Account struct {
	ID       string
	Email    string
	Verified bool
}

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

func timestamp(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

func truncate(s string, limit int) string {
	s = strings.TrimSpace(s)
	if len(s) <= limit {
		return s
	}
	return s[:limit]
}
