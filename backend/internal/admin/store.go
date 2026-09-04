// Package admin is what the company sees and does, and nobody else can.
//
// Every function here replaces a psql session. The person running this business
// is not a developer, and "run this SQL" has been the answer to giving a number
// away — which has often meant the answer to nothing happening at all.
//
// Nothing in this package checks who is asking. That is the route's job and it
// is done in one place, because a guard repeated in nine handlers is a guard
// missing from the tenth.
package admin

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

var (
	ErrNoAccount = errors.New("bunday hisob yo'q")
	ErrTaken     = errors.New("bu raqam allaqachon band")
)

type Store struct {
	queries *store.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{queries: store.New(pool)}
}

// The types below are named for the panel rather than for the thing, because
// they are not the same shape as the customer-facing ones: an order here
// carries the buyer's address, and a number here carries what was paid and why
// it was given. Huma refuses two schemas with one name, which is how the
// difference was noticed — the two really are different objects for different
// audiences, and collapsing them would have put a buyer's email on a screen
// that buyer can open.

// Overview is the front page of the panel.
type Overview struct {
	Claimed       int64 `json:"olingan"`
	Reserved      int64 `json:"band"`
	OrdersPending int64 `json:"kutilayotgan_buyurtmalar"`
	OrdersPaid    int64 `json:"tolangan_buyurtmalar"`
	// What has been received, which is not what has been ordered. Gifts have no
	// order and are excluded by construction.
	Taken int64 `json:"tushum"`
	Leads int64 `json:"vizitkalar"`
}

func (s *Store) Overview(ctx context.Context) (Overview, error) {
	row, err := s.queries.AdminOverview(ctx)
	if err != nil {
		return Overview{}, err
	}
	return Overview{
		Claimed:       row.Claimed,
		Reserved:      row.Reserved,
		OrdersPending: row.OrdersPending,
		OrdersPaid:    row.OrdersPaid,
		Taken:         row.Taken,
		Leads:         row.Leads,
	}, nil
}

type AdminOrder struct {
	ID        string     `json:"id"`
	Handle    string     `json:"raqam"`
	Buyer     string     `json:"xaridor"`
	Amount    int64      `json:"summa"`
	Kind      string     `json:"turi"`
	Status    string     `json:"holat"`
	Provider  string     `json:"tolov,omitempty"`
	CreatedAt *time.Time `json:"ochilgan,omitempty"`
	PaidAt    *time.Time `json:"tolangan,omitempty"`
}

func (s *Store) Orders(ctx context.Context, status string, limit, skip int32) ([]AdminOrder, error) {
	rows, err := s.queries.AdminOrders(ctx, store.AdminOrdersParams{
		Status:   optional(status),
		PageSize: limit,
		Skip:     skip,
	})
	if err != nil {
		return nil, err
	}

	out := make([]AdminOrder, 0, len(rows))
	for _, row := range rows {
		out = append(out, AdminOrder{
			ID:        row.ID.String(),
			Handle:    row.Handle,
			Buyer:     deref(row.Buyer),
			Amount:    row.Amount,
			Kind:      row.Kind,
			Status:    row.Status,
			Provider:  deref(row.Provider),
			CreatedAt: optionalTime(row.CreatedAt),
			PaidAt:    optionalTime(row.PaidAt),
		})
	}
	return out, nil
}

type AdminHandle struct {
	Number     string     `json:"raqam"`
	Status     string     `json:"holat"`
	Owner      string     `json:"egasi,omitempty"`
	Name       string     `json:"ism,omitempty"`
	Plan       string     `json:"tarif"`
	PricePaid  *int64     `json:"tolangan,omitempty"`
	GiftReason string     `json:"sovga_sababi,omitempty"`
	ClaimedAt  *time.Time `json:"olingan,omitempty"`
	Views      int64      `json:"korishlar"`
}

func (s *Store) Handles(ctx context.Context, term string, limit int32) ([]AdminHandle, error) {
	rows, err := s.queries.AdminHandles(ctx, store.AdminHandlesParams{
		Term:     optional(term),
		PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	out := make([]AdminHandle, 0, len(rows))
	for _, row := range rows {
		out = append(out, AdminHandle{
			Number:     deref(row.Normalized),
			Status:     row.Status,
			Owner:      deref(row.Owner),
			Name:       deref(row.OwnerName),
			Plan:       row.Plan,
			PricePaid:  row.PricePaid,
			GiftReason: deref(row.GiftReason),
			ClaimedAt:  optionalTime(row.ClaimedAt),
			Views:      row.ViewCount,
		})
	}
	return out, nil
}

// Give hands a number to somebody without a sale.
//
// The recipient must already have an account, because a number belongs to a
// user and there is nobody to give it to otherwise. Creating one here would
// mean sending somebody an account they did not ask for.
func (s *Store) Give(ctx context.Context, parsed handles.Parsed, email, name, reason string) (string, error) {
	account, err := s.queries.AdminUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNoAccount
	}
	if err != nil {
		return "", err
	}

	row, err := s.queries.AdminGiveHandle(ctx, store.AdminGiveHandleParams{
		Letters:   parsed.Letters,
		Digits:    parsed.Digits,
		UserID:    &account.ID,
		OwnerName: optional(name),
		Reason:    &reason,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return "", ErrTaken
		}
		return "", err
	}

	return deref(row.Normalized), nil
}
