package promo

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

var (
	// ErrUnusable covers every reason a code will not work: it does not exist,
	// it is switched off, it is spent, it is out of date, it does not apply to
	// this kind of order, or the order is under its minimum.
	//
	// One error, because the buyer does the same thing for all of them — try
	// another code — and enumerating them would let somebody map the campaign.
	ErrUnusable = errors.New("kod ishlamadi")
	// ErrAlreadyUsed is separate because the answer is different: this person
	// has used this code, and no other code will change that.
	ErrAlreadyUsed = errors.New("bu kod allaqachon ishlatilgan")
)

type Store struct {
	queries *store.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{queries: store.New(pool)}
}

// WithTx returns a store bound to a transaction, so claiming a code and
// creating the order it belongs to either both happen or neither does.
func (s *Store) WithTx(tx pgx.Tx) *Store {
	return &Store{queries: s.queries.WithTx(tx)}
}

// Claim takes one use of a code and works out what it is worth.
//
// The use is taken before the discount is computed, and by the database rather
// than by this function: `claim_promo_code` increments and returns the row in
// one statement, so a code with one use left cannot be used twice by two
// requests arriving together. If it returns nothing, there was nothing to take.
//
// The caller must release it if whatever it was claimed for does not complete.
func (s *Store) Claim(ctx context.Context, rawCode, orderKind, userID string, price int64) (Discount, error) {
	code, ok := Normalise(rawCode)
	if !ok {
		return Discount{}, ErrUnusable
	}

	owner, err := uuid.Parse(userID)
	if err != nil {
		return Discount{}, ErrUnusable
	}

	row, err := s.queries.ClaimPromoCode(ctx, store.ClaimPromoCodeParams{
		Code: code, Kind: orderKind, Amount: price,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Discount{}, ErrUnusable
	}
	if err != nil {
		return Discount{}, err
	}

	// Checked after the claim rather than before it, so this is told apart from
	// the other refusals — and released, because the use was taken. The unique
	// index is still what enforces it; this is so somebody gets a sentence
	// rather than a failed insert.
	if row.OncePerAccount {
		used, err := s.queries.HasRedeemedPromo(ctx, store.HasRedeemedPromoParams{
			Code: code, UserID: owner,
		})
		if err != nil || used {
			s.Release(ctx, code)
			if err != nil {
				return Discount{}, err
			}
			return Discount{}, ErrAlreadyUsed
		}
	}

	discount := Apply(Code{
		Code:        row.Code,
		Kind:        row.Kind,
		Value:       row.Value,
		MaxDiscount: derefInt64(row.MaxDiscount),
	}, price)

	// A code that takes nothing off and grants nothing is not a discount, and
	// recording it would leave a redemption the buyer got no benefit from.
	if discount.Amount == 0 && discount.Months == 0 {
		s.Release(ctx, code)
		return Discount{}, ErrUnusable
	}

	return discount, nil
}

// Release gives a use back. Failing to do so must never fail the thing it was
// claimed for — a code stuck one short is a smaller problem than an order that
// did not go through.
func (s *Store) Release(ctx context.Context, code string) {
	_ = s.queries.ReleasePromoCode(ctx, code)
}

// Record writes what the code actually gave, frozen. The code may be edited or
// switched off later, and what somebody was charged must not change when it is.
func (s *Store) Record(ctx context.Context, discount Discount, userID string, orderID *uuid.UUID) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	return s.queries.RecordPromoRedemption(ctx, store.RecordPromoRedemptionParams{
		Code:     discount.Code,
		UserID:   owner,
		OrderID:  orderID,
		Discount: discount.Amount,
		Months:   discount.Months,
	})
}

func derefInt64(v *int64) int64 {
	if v == nil {
		return 0
	}
	return *v
}
