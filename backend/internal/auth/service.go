package auth

import (
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/mail"
	"github.com/sheyx2772-dev/flex/backend/internal/sms"
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
	// The SMS channel. Its own interface for the same reason the mailer has
	// one, and more so: every message costs money, so a provider that is
	// misconfigured must fail loudly rather than quietly.
	sms sms.Sender
	// Where accounts live, which is not here — see directory.go.
	directory Directory
	// Where a sign-in link points. Configuration rather than a request header:
	// a Host an attacker controls would otherwise end up inside a link mailed
	// to a victim, pointing their one-time token at a server the attacker owns.
	siteURL string
}

func NewService(pool *pgxpool.Pool, mailer mail.Mailer, texter sms.Sender, directory Directory, siteURL string) *Service {
	return &Service{
		pool:      pool,
		queries:   store.New(pool),
		mailer:    mailer,
		sms:       texter,
		directory: directory,
		siteURL:   strings.TrimSuffix(siteURL, "/"),
	}
}

// Account is who a request turned out to be from.
type Account struct {
	ID       string
	Email    string
	Verified bool
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
