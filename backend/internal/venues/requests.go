package venues

import (
	"context"
	"errors"
	"net/netip"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// A guest standing at a point, asking for something.
//
// The kinds are fixed rather than free text: a waiter reading a phone behind a
// counter needs to know what is wanted at a glance, and "other" carries the
// note for everything that does not fit.

type RequestInput struct {
	Point  string `json:"nuqta" minLength:"1" maxLength:"40"`
	Kind   string `json:"turi" enum:"waiter,bill,review,clean,other"`
	Rating *int16 `json:"baho,omitempty" minimum:"1" maximum:"5"`
	Note   string `json:"izoh,omitempty" maxLength:"300"`
}

// Ask records a request and returns it.
//
// No session: the person asking is a guest with a phone, and requiring one
// would mean nobody ever asks. The rate limit is the point — a request names
// a table, and a table is a place somebody is standing.
var (
	// One press is a request; eleven presses is the same request eleven times,
	// and a waiter who is already walking over does not need to be told again.
	ErrTooSoon = errors.New("hozirgina yuborilgan")
	// The month has run out. Checked here and not only by hiding the button: a
	// page left open when it lapsed would otherwise keep writing rows nobody
	// is allowed to read, and a form can be posted by anyone in any case.
	ErrExpired = errors.New("obyekt muddati tugagan")
)

// A ceiling on one point for one hour, so a bored group cannot fill the
// counter's screen. Deliberately not a per-address limit: every guest in the
// room is behind the same Wi-Fi we printed the password for, so an address
// here is a whole cafe rather than a person.
const (
	perPointWindowMinutes = 2
	perPointPerHour       = 12
)

func (s *Store) Ask(ctx context.Context, handle string, in RequestInput, ip *netip.Addr) (Request, error) {
	expiry, err := s.queries.VenuePlanExpiry(ctx, &handle)
	if err != nil {
		return Request{}, ErrNotFound
	}
	if expiry.Valid && !expiry.Time.After(time.Now()) {
		return Request{}, ErrExpired
	}

	justNow, err := s.queries.RecentRequestsFromPoint(ctx, store.RecentRequestsFromPointParams{
		Handle: &handle, Point: &in.Point, Minutes: perPointWindowMinutes,
	})
	if err != nil {
		return Request{}, err
	}
	if justNow > 0 {
		return Request{}, ErrTooSoon
	}

	withinHour, err := s.queries.RecentRequestsFromPoint(ctx, store.RecentRequestsFromPointParams{
		Handle: &handle, Point: &in.Point, Minutes: 60,
	})
	if err != nil {
		return Request{}, err
	}
	if withinHour >= perPointPerHour {
		return Request{}, ErrTooSoon
	}

	var address *string
	if ip != nil {
		text := ip.String()
		address = &text
	}

	row, err := s.queries.CreateVenueRequest(ctx, store.CreateVenueRequestParams{
		Handle: &handle, Point: &in.Point, Kind: in.Kind,
		Rating: in.Rating, Note: optional(in.Note), Ip: address,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Request{}, ErrNotFound
	}
	if err != nil {
		return Request{}, err
	}
	return toRequest(row), nil
}

// Requests is what the counter sees.
func (s *Store) Requests(ctx context.Context, handle, userID, status string, limit int32) ([]Request, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.queries.VenueRequests(ctx, store.VenueRequestsParams{
		Handle: &handle, UserID: &owner, Status: optional(status), PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Request, 0, len(rows))
	for _, row := range rows {
		out = append(out, toRequest(row))
	}
	return out, nil
}

// Waiting is the badge on the cabinet's tab.
func (s *Store) Waiting(ctx context.Context, handle string) int64 {
	n, err := s.queries.CountWaitingRequests(ctx, &handle)
	if err != nil {
		return 0
	}
	return n
}

func (s *Store) Close(ctx context.Context, id uuid.UUID, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.CloseVenueRequest(ctx, store.CloseVenueRequestParams{
		ID: id, UserID: &owner,
	}))
}

func toRequest(r store.VenueRequest) Request {
	return Request{
		ID: r.ID.String(), Point: deref(r.Point), Kind: r.Kind, Rating: r.Rating,
		Note: deref(r.Note), Status: r.Status,
		At: r.CreatedAt.Time, DoneAt: optionalTime(r.DoneAt),
	}
}

// RequestsByToken is the counter screen's list. No session: the token is what
// a waiter's phone has instead of an account.
func (s *Store) RequestsByToken(ctx context.Context, token string, limit int32) ([]Request, error) {
	rows, err := s.queries.RequestsByToken(ctx, store.RequestsByTokenParams{
		Token: &token, PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Request, 0, len(rows))
	for _, row := range rows {
		out = append(out, toRequest(row))
	}
	return out, nil
}

func (s *Store) CloseByToken(ctx context.Context, token string, id uuid.UUID) error {
	return rowsOrNotFound(s.queries.CloseRequestByToken(ctx, store.CloseRequestByTokenParams{
		Token: &token, ID: id,
	}))
}
