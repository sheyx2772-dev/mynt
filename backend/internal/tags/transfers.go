package tags

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Handing a number to somebody else.
//
// Offered by address rather than to an account, because the person receiving
// it may not have one yet — buying a number for a colleague and mailing it to
// them is the ordinary case. The offer lapses after a week: an open transfer
// is a claim on a number, and one left forever is a number in limbo.

var ErrTransferGone = errors.New("o'tkazish topilmadi")

type Transfer struct {
	ID      string     `json:"id"`
	Handle  string     `json:"raqam"`
	ToEmail string     `json:"kimga"`
	Status  string     `json:"holat"`
	At      time.Time  `json:"boshlangan"`
	Expires *time.Time `json:"tugashi,omitempty"`
}

func toTransfer(t store.HandleTransfer) Transfer {
	return Transfer{
		ID: t.ID.String(), Handle: t.Handle, ToEmail: t.ToEmail,
		Status: t.Status, At: t.CreatedAt.Time, Expires: optionalTime(t.ExpiresAt),
	}
}

func (s *Store) TransfersFor(ctx context.Context, handle, userID string) ([]Transfer, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrTransferGone
	}

	rows, err := s.queries.TransfersForHandle(ctx, store.TransfersForHandleParams{
		Handle: handle, UserID: owner,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Transfer, 0, len(rows))
	for _, row := range rows {
		out = append(out, toTransfer(row))
	}
	return out, nil
}

// Incoming is what has been offered to this account's address.
func (s *Store) Incoming(ctx context.Context, userID string) ([]Transfer, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrTransferGone
	}

	rows, err := s.queries.IncomingTransfers(ctx, id)
	if err != nil {
		return nil, err
	}

	out := make([]Transfer, 0, len(rows))
	for _, row := range rows {
		out = append(out, toTransfer(row))
	}
	return out, nil
}

func (s *Store) Offer(ctx context.Context, handle, userID, toEmail string) (Transfer, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Transfer{}, ErrTransferGone
	}

	row, err := s.queries.OfferTransfer(ctx, store.OfferTransferParams{
		Handle: &handle, UserID: owner, ToEmail: toEmail,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Transfer{}, ErrTransferGone
	}
	if err != nil {
		return Transfer{}, err
	}
	return toTransfer(row), nil
}

func (s *Store) Cancel(ctx context.Context, id uuid.UUID, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrTransferGone
	}
	rows, err := s.queries.CancelTransfer(ctx, store.CancelTransferParams{ID: id, UserID: owner})
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrTransferGone
	}
	return nil
}

// Accept moves the number and settles the offer, in one transaction.
//
// The two must not be able to happen separately: an offer marked accepted
// without the number moving is a number nobody owns, and a number moved
// without the offer settling can be accepted again.
func (s *Store) Accept(ctx context.Context, id uuid.UUID, userID string) (string, error) {
	newOwner, err := uuid.Parse(userID)
	if err != nil {
		return "", ErrTransferGone
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	q := s.queries.WithTx(tx)

	handle, err := q.AcceptTransfer(ctx, store.AcceptTransferParams{ID: id, UserID: &newOwner})
	if errors.Is(err, pgx.ErrNoRows) {
		// Expired, already settled, or offered to somebody else. One answer,
		// because the difference is only useful to whoever is guessing ids.
		return "", ErrTransferGone
	}
	if err != nil {
		return "", err
	}

	if _, err := q.MoveHandle(ctx, store.MoveHandleParams{
		Handle: &handle, UserID: &newOwner,
	}); err != nil {
		return "", err
	}

	return handle, tx.Commit(ctx)
}

func optionalTime(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	at := t.Time
	return &at
}
