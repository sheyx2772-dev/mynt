package venues

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// What a venue is billed.
//
// The figures are copied onto the row rather than referenced: the price list
// will change and a document has to keep saying what it said when it was
// issued. Everything here is scoped to the owner, so a guessed id belonging to
// somebody else's cafe is nothing rather than their prices.

type Invoice struct {
	ID     string     `json:"id"`
	Number int64      `json:"raqam"`
	Points int32      `json:"nuqtalar"`
	Months int32      `json:"oylar"`
	Month  int64      `json:"oylik"`
	VAT    int32      `json:"qqs_foizi"`
	Total  int64      `json:"jami"`
	Status string     `json:"holat"`
	At     time.Time  `json:"berilgan"`
	PaidAt *time.Time `json:"tolangan,omitempty"`
}

func toInvoice(i store.VenueInvoice) Invoice {
	return Invoice{
		ID: i.ID.String(), Number: i.Number, Points: i.Points, Months: i.Months,
		Month: i.Monthly, VAT: numericToInt32(i.VatPercent), Total: i.Total, Status: i.Status,
		At: i.IssuedAt.Time, PaidAt: optionalTime(i.PaidAt),
	}
}

func (s *Store) Invoices(ctx context.Context, handle, userID string) ([]Invoice, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.queries.VenueInvoices(ctx, store.VenueInvoicesParams{
		Handle: &handle, UserID: &owner,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Invoice, 0, len(rows))
	for _, row := range rows {
		out = append(out, toInvoice(row))
	}
	return out, nil
}

func (s *Store) Invoice(ctx context.Context, id uuid.UUID, userID string) (Invoice, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Invoice{}, ErrNotFound
	}

	row, err := s.queries.VenueInvoice(ctx, store.VenueInvoiceParams{ID: id, UserID: &owner})
	if errors.Is(err, pgx.ErrNoRows) {
		return Invoice{}, ErrNotFound
	}
	if err != nil {
		return Invoice{}, err
	}
	return toInvoice(row), nil
}

// Issue writes one. The caller has already worked out the figures, because
// the price bands are a product decision that lives beside the price list.
func (s *Store) Issue(ctx context.Context, handle, userID string, points, months, vat int32, monthly, total int64) (Invoice, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Invoice{}, ErrNotFound
	}

	row, err := s.queries.IssueVenueInvoice(ctx, store.IssueVenueInvoiceParams{
		Handle: &handle, UserID: &owner,
		Points: points, Months: months, Monthly: monthly,
		VatPercent: int32ToNumeric(vat), Total: total,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Invoice{}, ErrNotFound
	}
	if err != nil {
		return Invoice{}, err
	}
	return toInvoice(row), nil
}

// The VAT rate is `numeric` in the schema the website created, and whole
// percents in practice — twelve, not twelve and a half. Converted at the edge
// rather than carried as a decimal through every screen that shows it.
func numericToInt32(n pgtype.Numeric) int32 {
	if !n.Valid || n.Int == nil {
		return 0
	}
	value, err := n.Int64Value()
	if err != nil || !value.Valid {
		return 0
	}
	return int32(value.Int64)
}

func int32ToNumeric(v int32) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(strconv.Itoa(int(v)))
	return n
}
