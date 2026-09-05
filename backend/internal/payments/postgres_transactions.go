package payments

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// The two providers' transaction tables. Payme identifies a transaction only by
// its own id after CreateTransaction, so this mapping is a row rather than
// something that can be recomputed.

func (p *Postgres) FindPaymeTransaction(ctx context.Context, id string) (*PaymeTransaction, error) {
	row, err := p.queries.PaymeTransactionByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return paymeFromRow(row.ID, row.OrderID, row.Amount, row.State, row.CreateTime, row.PerformTime, row.CancelTime, row.Reason), nil
}

func (p *Postgres) FindPaymeTransactionByOrder(ctx context.Context, orderID string) (*PaymeTransaction, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, nil
	}
	row, err := p.queries.PaymeTransactionByOrder(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return paymeFromRow(row.ID, row.OrderID, row.Amount, row.State, row.CreateTime, row.PerformTime, row.CancelTime, row.Reason), nil
}

func paymeFromRow(id string, orderID uuid.UUID, amount int64, state int16, create, perform, cancel int64, reason *int16) *PaymeTransaction {
	tx := &PaymeTransaction{
		ID:          id,
		OrderID:     orderID.String(),
		Amount:      amount,
		State:       int(state),
		CreateTime:  create,
		PerformTime: perform,
		CancelTime:  cancel,
	}
	if reason != nil {
		value := int(*reason)
		tx.Reason = &value
	}
	return tx
}

func (p *Postgres) CreatePaymeTransaction(ctx context.Context, tx PaymeTransaction) error {
	orderID, err := uuid.Parse(tx.OrderID)
	if err != nil {
		return err
	}
	return p.queries.CreatePaymeTransaction(ctx, store.CreatePaymeTransactionParams{
		ID:         tx.ID,
		OrderID:    orderID,
		Amount:     tx.Amount,
		State:      int16(tx.State),
		CreateTime: tx.CreateTime,
	})
}

func (p *Postgres) UpdatePaymeTransaction(ctx context.Context, id string, state int, performTime, cancelTime int64, reason *int) error {
	var stored *int16
	if reason != nil {
		value := int16(*reason)
		stored = &value
	}
	return p.queries.UpdatePaymeTransaction(ctx, store.UpdatePaymeTransactionParams{
		ID:          id,
		State:       int16(state),
		PerformTime: performTime,
		CancelTime:  cancelTime,
		Reason:      stored,
	})
}

func (p *Postgres) FindClickTransaction(ctx context.Context, id string) (*ClickTransaction, error) {
	row, err := p.queries.ClickTransactionByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &ClickTransaction{
		ID:          row.ID,
		OrderID:     row.OrderID.String(),
		Amount:      row.Amount,
		PreparedAt:  millis(row.PreparedAt),
		CompletedAt: millis(row.CompletedAt),
		CancelledAt: millis(row.CancelledAt),
	}, nil
}

func (p *Postgres) CreateClickTransaction(ctx context.Context, tx ClickTransaction) error {
	orderID, err := uuid.Parse(tx.OrderID)
	if err != nil {
		return err
	}
	return p.queries.CreateClickTransaction(ctx, store.CreateClickTransactionParams{
		ID:         tx.ID,
		OrderID:    orderID,
		Amount:     tx.Amount,
		PreparedAt: stamp(tx.PreparedAt),
	})
}

func (p *Postgres) UpdateClickTransaction(ctx context.Context, id string, prepared, completed, cancelled *int64) error {
	return p.queries.UpdateClickTransaction(ctx, store.UpdateClickTransactionParams{
		ID:          id,
		PreparedAt:  stamp(prepared),
		CompletedAt: stamp(completed),
		CancelledAt: stamp(cancelled),
	})
}
