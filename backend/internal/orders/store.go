package orders

import (
	"context"
	"errors"
	"net/netip"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// How long a number is held while an order is paid for. Long enough to open a
// bank app and finish, short enough that an abandoned checkout does not keep a
// number off the market for the afternoon.
const ReservationFor = 30 * time.Minute

// Claims are counted twice, both windows an hour. Per account stops one person
// hoarding; per source stops one script driving many throwaway accounts.
const (
	claimsPerUserPerHour = 5
	claimsPerIPPerHour   = 15
	claimWindow          = time.Hour
)

var (
	// ErrTaken is the race being lost, and also somebody trying a number that
	// was sold last week. One error, because the buyer does the same thing
	// either way: pick another number.
	ErrTaken = errors.New("bu raqam allaqachon band")
	// ErrRateLimited is told to the buyer plainly. Unlike a sign-in link there
	// is nothing to disclose: they know what they just tried to do.
	ErrRateLimited = errors.New("juda ko'p urinish")
	ErrNotFound    = errors.New("topilmadi")
	// ErrCannotSell is a production deployment with no payment provider
	// configured. It refuses to sell rather than giving the number away.
	ErrCannotSell = errors.New("to'lov tizimi sozlanmagan")
)

type Store struct {
	pool    *pgxpool.Pool
	queries *store.Queries
	// Whether a provider is configured. With neither, a number is claimed
	// outright and free — which is what development and a preview deployment
	// want, and what the website already does.
	paid Providers
	// Whether this process is a development one. Only development gives a
	// number away free — see Providers.GiveAway.
	development bool
}

func NewStore(pool *pgxpool.Pool, providers Providers, development bool) *Store {
	return &Store{
		pool:        pool,
		queries:     store.New(pool),
		paid:        providers,
		development: development,
	}
}

// State is what somebody typing a number into the app needs to know.
type State struct {
	Number    string `json:"raqam"`
	Available bool   `json:"bosh"`
	Price     int64  `json:"narx"`
	// Why it costs what it costs. The site shows the buyer the whole breakdown
	// before they pay, because a price with no explanation reads as one
	// somebody made up.
	LetterReason string `json:"harflar"`
	DigitReason  string `json:"raqamlar"`
}

// Check reports whether a number can be bought, and for how much.
//
// A reservation nobody paid for counts as available: the row is still there,
// but it stopped meaning anything when its deadline passed.
func (s *Store) Check(ctx context.Context, parsed handles.Parsed) (State, error) {
	normalized := parsed.Normalized()

	state := State{
		Number:       normalized,
		Available:    true,
		Price:        int64(parsed.Price()),
		LetterReason: handles.LetterRarity(parsed.Letters).Reason,
		DigitReason:  handles.DigitRarity(parsed.Digits).Reason,
	}

	row, err := s.queries.HandleState(ctx, &normalized)
	if errors.Is(err, pgx.ErrNoRows) {
		return state, nil
	}
	if err != nil {
		return State{}, err
	}

	switch row.Status {
	case "claimed":
		state.Available = false
	case "reserved":
		state.Available = row.ReservedUntil.Valid && row.ReservedUntil.Time.Before(time.Now())
	}

	return state, nil
}

func (s *Store) withinRateLimit(ctx context.Context, userID uuid.UUID, ip *string) (bool, error) {
	seconds := int32(claimWindow.Seconds())

	byUser, err := s.queries.CountRecentClaimsByUser(ctx, store.CountRecentClaimsByUserParams{
		UserID: &userID, WindowSeconds: seconds,
	})
	if err != nil || byUser >= claimsPerUserPerHour {
		return false, err
	}

	if ip == nil {
		return true, nil
	}

	bySource, err := s.queries.CountRecentClaimsByIP(ctx, store.CountRecentClaimsByIPParams{
		Ip: ip, WindowSeconds: seconds,
	})
	if err != nil {
		return false, err
	}
	return bySource < claimsPerIPPerHour, nil
}

// addressText renders an address for `claim_attempts.ip`, which is text in the
// schema the website created rather than inet.
func addressText(ip *netip.Addr) *string {
	if ip == nil {
		return nil
	}
	text := ip.String()
	return &text
}

func timestamp(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

// isDuplicate reports whether an insert lost the race for a number.
//
// 23505 is the unique index on `normalized` doing the job no application code
// can do: two orders arriving at once produce one reservation and one refusal.
func isDuplicate(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func optionalTime(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}
