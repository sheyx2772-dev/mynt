package orders

import (
	"context"
	"errors"
	"net/netip"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Order is what a buyer gets back when they start one.
type Order struct {
	ID     string `json:"id"`
	Number string `json:"raqam"`
	Amount int64  `json:"summa"`
	Status string `json:"holat" enum:"pending,paid,cancelled,failed"`

	// Where to pay. Empty when no provider is configured, in which case the
	// number is already claimed and there is nothing to pay.
	Checkout Checkout `json:"tolov,omitzero"`

	// When the reservation lapses, if it has not been paid for by then.
	ReservedUntil *time.Time `json:"band_muddati,omitempty"`
}

// Buy reserves a number for somebody and records what they owe for it.
//
// The price is computed here from the number itself and written onto both the
// handle and the order. It is never read from the request: a price that arrives
// with an order is a price the buyer chose.
func (s *Store) Buy(ctx context.Context, parsed handles.Parsed, userID, name string, ip *netip.Addr) (Order, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Order{}, ErrNotFound
	}

	normalized := parsed.Normalized()
	address := addressText(ip)

	allowed, err := s.withinRateLimit(ctx, owner, address)
	if err != nil {
		return Order{}, err
	}
	if !allowed {
		s.record(ctx, owner, address, normalized, false)
		return Order{}, ErrRateLimited
	}

	// A reservation nobody paid for must not hold a number forever. Cleared
	// here rather than only by a sweep, so a buyer is never told a number is
	// taken by an order that expired an hour ago.
	if _, err := s.queries.ClearExpiredReservation(ctx, &normalized); err != nil {
		return Order{}, err
	}

	price := int64(parsed.Price())
	owned := optional(name)

	if !s.paid.Any() {
		if !s.paid.GiveAway(s.development) {
			return Order{}, ErrCannotSell
		}
		return s.giveAway(ctx, parsed, owner, address, owned, price)
	}

	// One transaction. A reservation without an order is a number held for
	// thirty minutes that nobody can pay for, and the website's own claim path
	// cleans that case up while this one did not.
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Order{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := s.queries.WithTx(tx)

	row, err := q.ReserveHandle(ctx, store.ReserveHandleParams{
		Letters:       parsed.Letters,
		Digits:        parsed.Digits,
		UserID:        &owner,
		OwnerName:     owned,
		Price:         &price,
		ReservedUntil: timestamp(time.Now().Add(ReservationFor)),
	})
	if err != nil {
		s.record(ctx, owner, address, normalized, false)
		if isDuplicate(err) {
			return Order{}, ErrTaken
		}
		return Order{}, err
	}

	order, err := q.CreateOrder(ctx, store.CreateOrderParams{
		UserID: owner,
		Handle: normalized,
		Amount: price,
	})
	if err != nil {
		return Order{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Order{}, err
	}

	s.record(ctx, owner, address, normalized, true)

	return Order{
		ID:            order.ID.String(),
		Number:        normalized,
		Amount:        price,
		Status:        order.Status,
		Checkout:      s.paid.checkoutFor(order.ID.String(), price, ReservationFor),
		ReservedUntil: optionalTime(row.ReservedUntil),
	}, nil
}

// giveAway claims a number outright, for a deployment with no provider keys.
func (s *Store) giveAway(ctx context.Context, parsed handles.Parsed, owner uuid.UUID, address, name *string, price int64) (Order, error) {
	normalized := parsed.Normalized()

	if _, err := s.queries.ClaimHandleOutright(ctx, store.ClaimHandleOutrightParams{
		Letters:   parsed.Letters,
		Digits:    parsed.Digits,
		UserID:    &owner,
		OwnerName: name,
		Price:     &price,
	}); err != nil {
		s.record(ctx, owner, address, normalized, false)
		if isDuplicate(err) {
			return Order{}, ErrTaken
		}
		return Order{}, err
	}

	s.record(ctx, owner, address, normalized, true)

	// No order row: nothing is owed, so there is nothing to reconcile later.
	return Order{Number: normalized, Amount: price, Status: "paid"}, nil
}

// Order reads one order back, under its buyer's id. Somebody else's order is
// no rows, which is the authorization.
func (s *Store) Order(ctx context.Context, id, userID string) (Order, error) {
	orderID, err := uuid.Parse(id)
	if err != nil {
		return Order{}, ErrNotFound
	}
	buyer, err := uuid.Parse(userID)
	if err != nil {
		return Order{}, ErrNotFound
	}

	row, err := s.queries.OrderForUser(ctx, store.OrderForUserParams{ID: orderID, UserID: buyer})
	if errors.Is(err, pgx.ErrNoRows) {
		return Order{}, ErrNotFound
	}
	if err != nil {
		return Order{}, err
	}

	order := Order{
		ID:     row.ID.String(),
		Number: row.Handle,
		Amount: row.Amount,
		Status: row.Status,
	}
	// Somewhere to pay, but only while paying is still what the order needs.
	if row.Status == "pending" {
		// What is left of the reservation, so a page opened now expires with
		// the number rather than outliving it.
		left := ReservationFor
		if row.CreatedAt.Valid {
			left = time.Until(row.CreatedAt.Time.Add(ReservationFor))
		}
		order.Checkout = s.paid.checkoutFor(order.ID, order.Amount, left)
	}
	return order, nil
}

// record notes an attempt, whatever came of it. Failing to write it must never
// fail a purchase that otherwise worked.
func (s *Store) record(ctx context.Context, userID uuid.UUID, ip *string, handle string, succeeded bool) {
	_ = s.queries.RecordClaimAttempt(ctx, store.RecordClaimAttemptParams{
		UserID: &userID, Ip: ip, Handle: &handle, Succeeded: succeeded,
	})
}

func optional(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
