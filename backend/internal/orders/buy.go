package orders

import (
	"context"
	"errors"
	"net/netip"
	"time"

	"github.com/google/uuid"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/promo"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Order is what a buyer gets back when they start one.
type Order struct {
	ID     string `json:"id"`
	Number string `json:"raqam"`
	Amount int64  `json:"summa"`
	Status string `json:"holat" enum:"pending,paid,cancelled,failed"`
	// What was bought. A page that has to say "your number" or "your ring"
	// cannot work it out from the amount.
	Kind string `json:"turi" enum:"handle,subscription,device,transfer,venue"`

	// Whether the number is still held by this buyer. Not implied by `paid`:
	// a refund releases it, and money arriving after the hold lapsed leaves a
	// paid order with nothing attached.
	Held bool `json:"meniki"`

	// Where to pay. Empty when no provider is configured, in which case the
	// number is already claimed and there is nothing to pay.
	Checkout Checkout `json:"tolov,omitzero"`

	// What a promo code took off, if one was used. Returned so the buyer can
	// see it rather than only a smaller number than the one they were quoted.
	Discount *promo.Discount `json:"chegirma,omitempty"`

	// When the reservation lapses, if it has not been paid for by then.
	ReservedUntil *time.Time `json:"band_muddati,omitempty"`
}

// Buy reserves a number for somebody and records what they owe for it.
//
// The price is computed here from the number itself and written onto both the
// handle and the order. It is never read from the request: a price that arrives
// with an order is a price the buyer chose.
func (s *Store) Buy(ctx context.Context, parsed handles.Parsed, userID, name, code string, ip *netip.Addr) (Order, error) {
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

	// Recomputed here from the number itself. A price that arrives with an
	// order is a price the buyer chose.
	price := int64(parsed.Price())
	owned := optional(name)

	if !s.paid.Any() {
		if !s.paid.GiveAway(s.development) {
			return Order{}, ErrCannotSell
		}
		return s.giveAway(ctx, parsed, owner, address, owned, price)
	}

	// One transaction. A reservation without an order is a number held for
	// thirty minutes that nobody can pay for, and a promo code claimed against
	// an order that was never created is a use taken for nothing.
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Order{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := s.queries.WithTx(tx)
	promos := s.promo.WithTx(tx)

	// Claimed before the number is reserved, so a spent code refuses the
	// purchase rather than holding a number for an order that cannot be made
	// at the price the buyer was shown.
	var discount *promo.Discount
	if code != "" {
		applied, err := promos.Claim(ctx, code, promo.ForHandle, userID, price)
		switch {
		case errors.Is(err, promo.ErrAlreadyUsed):
			return Order{}, ErrPromoUsed
		case errors.Is(err, promo.ErrUnusable):
			return Order{}, ErrPromoBad
		case err != nil:
			return Order{}, err
		}
		discount = &applied
		price -= applied.Amount
	}

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

	if discount != nil {
		if err := promos.Record(ctx, *discount, userID, &order.ID); err != nil {
			return Order{}, err
		}
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
		Discount:      discount,
	}, nil
}
