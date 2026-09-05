package payments

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// The Store, against the real database.
//
// Everything above this file is the protocol and can be tested without one. The
// interesting part here is what settling actually does, which is different for
// each of the three kinds of order — and getting that wrong is how a refunded
// ring came to delete a paid number on the website side.

type Postgres struct {
	queries *store.Queries
}

func NewPostgres(pool *pgxpool.Pool) *Postgres {
	return &Postgres{queries: store.New(pool)}
}

func (p *Postgres) FindOrder(ctx context.Context, orderID string) (*Order, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		// Providers send whatever was in the checkout URL. Anything that is not
		// a uuid would make Postgres raise rather than simply not match.
		return nil, nil
	}

	row, err := p.queries.PaymentOrder(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	provider := ""
	if row.Provider != nil {
		provider = *row.Provider
	}

	return &Order{
		ID:       row.ID.String(),
		UserID:   row.UserID.String(),
		Handle:   row.Handle,
		Amount:   row.Amount,
		Status:   row.Status,
		Provider: provider,
	}, nil
}

// MarkOrderPaid settles an order and does whatever that kind of order buys.
//
// The update is conditional on `pending`, so a provider retry finds nothing to
// settle and buys nothing a second time.
func (p *Postgres) MarkOrderPaid(ctx context.Context, orderID, provider, txID string) error {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return err
	}

	settled, err := p.queries.SettleOrder(ctx, store.SettleOrderParams{
		ID: id, Provider: &provider, TxID: &txID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil // Already settled. The retry is a no-op, as it should be.
	}
	if err != nil {
		return err
	}

	switch settled.Kind {
	case "subscription":
		months := int32(1)
		if settled.Months != nil {
			months = *settled.Months
		}
		return p.queries.ExtendPremium(ctx, store.ExtendPremiumParams{
			TargetHandle: settled.Handle, AddMonths: months,
		})

	case "device":
		// A physical thing. Nothing about the number changes, and the work
		// starts elsewhere.
		//
		// The website raises a notice here so somebody knows to make it. That
		// notification is not ported yet and must be before the merchant
		// cabinets are pointed at this server, or a paid device order will sit
		// in the queue unannounced.
		slog.Info("qurilma buyurtmasi to'landi", "buyurtma", orderID, "raqam", settled.Handle)
		return nil

	default:
		// A number. The update carries the same ownership filter as everything
		// else, so a payment for a reservation that is no longer the buyer's
		// touches nothing — and says so, because zero rows is the signal.
		claimed, err := p.queries.ClaimReservedHandle(ctx, store.ClaimReservedHandleParams{
			Normalized: &settled.Handle, UserID: &settled.UserID,
		})
		if err != nil {
			return err
		}
		if claimed == 0 {
			// Reached only if the reservation was lost between the check in the
			// handler and this write. Loud, because it is money taken for
			// nothing and nothing else would find it.
			slog.Error("to'lov o'tdi, lekin raqam biriktirilmadi",
				"buyurtma", orderID, "raqam", settled.Handle)
		}
		return nil
	}
}

// MarkOrderCancelled undoes what that kind of order bought, which is different
// for all three — see the switch, and the comment on the default.
func (p *Postgres) MarkOrderCancelled(ctx context.Context, orderID string) error {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return err
	}

	cancelled, err := p.queries.CancelOrder(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}

	switch cancelled.Kind {
	case "subscription":
		// Only a refund needs undoing. An order cancelled before payment never
		// extended anything, so subtracting would take time the owner paid for
		// on an earlier one.
		if cancelled.Status != "paid" {
			return nil
		}
		months := int32(1)
		if cancelled.Months != nil {
			months = *cancelled.Months
		}
		return p.queries.ExtendPremium(ctx, store.ExtendPremiumParams{
			TargetHandle: cancelled.Handle, AddMonths: -months,
		})

	case "device":
		// A ring being refunded does not cancel the number it was ordered
		// against. The website released it here until today, which deleted a
		// claimed, paid number and everything cascading off it.
		return nil

	case "handle":
		_, err := p.queries.ReleaseHandle(ctx, store.ReleaseHandleParams{
			Normalized: &cancelled.Handle, UserID: &cancelled.UserID,
		})
		return err

	default:
		// A fourth kind arriving without this file being touched leaves a paid
		// asset alone and is noticed, rather than destroying one by default.
		slog.Warn("noma'lum buyurtma turi bekor qilindi", "turi", cancelled.Kind, "buyurtma", orderID)
		return nil
	}
}

func (p *Postgres) IsHandleStillHeld(ctx context.Context, orderID string) (bool, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return false, nil
	}
	return p.queries.HandleStillHeld(ctx, id)
}

func millis(t pgtype.Timestamptz) *int64 {
	if !t.Valid {
		return nil
	}
	ms := t.Time.UnixMilli()
	return &ms
}

func stamp(ms *int64) pgtype.Timestamptz {
	if ms == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: time.UnixMilli(*ms), Valid: true}
}
