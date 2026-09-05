package orders

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Reading an order back, and the path for a deployment that takes no money.

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

	// Already asked by the payment side, and one question for all three kinds
	// of order — so it is that query rather than a second one saying the same
	// thing in a different way.
	held, err := s.queries.HandleStillHeld(ctx, orderID)
	if err != nil {
		return Order{}, err
	}

	order := Order{
		ID:     row.ID.String(),
		Number: row.Handle,
		Amount: row.Amount,
		Status: row.Status,
		Kind:   row.Kind,
		Held:   held,
	}
	// Somewhere to pay, but only while paying is still what the order needs.
	if row.Status == "pending" {
		// What is left of the reservation, so a page opened now expires with
		// the number rather than outliving it.
		left := ReservationFor
		if row.CreatedAt.Valid {
			left = time.Until(row.CreatedAt.Time.Add(ReservationFor))
		}
		order.Checkout = s.paid.checkoutFor(order.ID, returnPathFor(order.Kind, order.ID), order.Amount, left)
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

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
