package orders

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Buying premium for a fixed period.
//
// Not a recurring charge: the providers here do card-on-file through a separate
// tokenised API, and holding a card that cannot be cancelled from this codebase
// would be worse for the buyer than asking them to renew. So this sells one
// month or one year, and the plan simply runs out if nobody renews — the number
// stays theirs and the profile stays up either way.

// What premium costs. Here rather than in a request, for the same reason a
// number's price is: an amount that arrives with an order is an amount the
// buyer chose.
const (
	PremiumMonthly = 49_000
	PremiumYearly  = 490_000
)

// Period is how long is being bought.
type Period string

const (
	Monthly Period = "monthly"
	Yearly  Period = "yearly"
)

// SubscriptionPrice reports what a period costs, and how many months it is.
func SubscriptionPrice(period Period) (amount int64, months int32, ok bool) {
	switch period {
	case Monthly:
		return PremiumMonthly, 1, true
	case Yearly:
		return PremiumYearly, 12, true
	}
	return 0, 0, false
}

// Subscribe opens a subscription order and says where to pay for it.
//
// Unlike buying a number, nothing is reserved and nothing is given away: the
// plan is only extended when the money lands, by the same settlement that
// claims a number. A deployment with no provider therefore cannot subscribe at
// all, and says so rather than granting premium for nothing.
func (s *Store) Subscribe(ctx context.Context, userID, handle string, period Period) (Order, error) {
	amount, months, ok := SubscriptionPrice(period)
	if !ok {
		return Order{}, ErrNotFound
	}
	if !s.paid.Any() {
		return Order{}, ErrCannotSell
	}

	owner, err := uuid.Parse(userID)
	if err != nil {
		return Order{}, ErrNotFound
	}

	row, err := s.queries.PlaceSubscriptionOrder(ctx, store.PlaceSubscriptionOrderParams{
		UserID: owner, Handle: &handle, Amount: amount, Months: &months,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Order{}, ErrNotFound
	}
	if err != nil {
		return Order{}, err
	}

	return Order{
		ID:     row.ID.String(),
		Number: row.Handle,
		Amount: row.Amount,
		Status: row.Status,
		Kind:   row.Kind,
		Held:   true,
		// No reservation window to match, so the payment page is good for the
		// provider's own default. There is nothing underneath it that somebody
		// else can buy in the meantime.
		Checkout: s.paid.checkoutFor(row.ID.String(), returnPathFor("subscription", row.ID.String()), row.Amount, 0),
	}, nil
}
