package teams

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// What a company is billed, and the details that go on the document.

// TeamInvoice, not Invoice: a venue is billed per table and a company per
// seat, so the two documents carry different figures and cannot share a name
// in one API document.
type TeamInvoice struct {
	ID     string     `json:"id"`
	Number int64      `json:"raqam"`
	Seats  int32      `json:"orinlar"`
	Months int32      `json:"oylar"`
	Seat   int64      `json:"orin_oylik"`
	VAT    int32      `json:"qqs_foizi"`
	Total  int64      `json:"jami"`
	Status string     `json:"holat"`
	At     time.Time  `json:"berilgan"`
	PaidAt *time.Time `json:"tolangan,omitempty"`
}

// Requisites is what an invoice is made out to.
type Requisites struct {
	LegalName string `json:"yuridik_nom,omitempty" maxLength:"200"`
	INN       string `json:"inn,omitempty" maxLength:"20"`
	Address   string `json:"manzil,omitempty" maxLength:"200"`
	Bank      string `json:"bank,omitempty" maxLength:"120"`
	Account   string `json:"hisob,omitempty" maxLength:"40"`
	MFO       string `json:"mfo,omitempty" maxLength:"10"`
	Director  string `json:"rahbar,omitempty" maxLength:"120"`
}

func toInvoice(i store.TeamInvoice) TeamInvoice {
	return TeamInvoice{
		ID: i.ID.String(), Number: i.Number, Seats: i.Seats, Months: i.Months,
		Seat: i.SeatMonthly, VAT: numericToInt32(i.VatPercent), Total: i.Total,
		Status: i.Status, At: i.IssuedAt.Time, PaidAt: optionalTime(i.PaidAt),
	}
}

func (s *Store) Invoices(ctx context.Context, userID string) ([]TeamInvoice, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.queries.TeamInvoices(ctx, id)
	if err != nil {
		return nil, err
	}

	out := make([]TeamInvoice, 0, len(rows))
	for _, row := range rows {
		out = append(out, toInvoice(row))
	}
	return out, nil
}

func (s *Store) Invoice(ctx context.Context, id uuid.UUID, userID string) (TeamInvoice, error) {
	member, err := uuid.Parse(userID)
	if err != nil {
		return TeamInvoice{}, ErrNotFound
	}

	row, err := s.queries.TeamInvoice(ctx, store.TeamInvoiceParams{ID: id, UserID: member})
	if errors.Is(err, pgx.ErrNoRows) {
		return TeamInvoice{}, ErrNotFound
	}
	if err != nil {
		return TeamInvoice{}, err
	}
	return toInvoice(row), nil
}

// Issue writes one. Owner only — the statement says so.
func (s *Store) Issue(ctx context.Context, userID string, seats, months, vat int32, seatMonthly, total int64) (TeamInvoice, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return TeamInvoice{}, ErrNotFound
	}

	row, err := s.queries.IssueTeamInvoice(ctx, store.IssueTeamInvoiceParams{
		UserID: owner, Seats: seats, Months: months,
		SeatMonthly: seatMonthly, VatPercent: int32ToNumeric(vat), Total: total,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return TeamInvoice{}, ErrNotFound
	}
	if err != nil {
		return TeamInvoice{}, err
	}
	return toInvoice(row), nil
}

// SaveRequisites changes what goes on an invoice. Owner only: an invoice with
// somebody else's bank details on it is a fraud with our name on the top.
func (s *Store) SaveRequisites(ctx context.Context, userID string, in Requisites) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.SaveRequisites(ctx, store.SaveRequisitesParams{
		UserID:    owner,
		LegalName: optional(in.LegalName), Inn: optional(in.INN),
		Address: optional(in.Address), BankName: optional(in.Bank),
		BankAccount: optional(in.Account), BankMfo: optional(in.MFO),
		Director: optional(in.Director),
	}))
}

// ContactRequest is a company asking to be contacted. No session: it is a form
// on a public page, and the whole point is that they have not signed up yet.
//
// Not called Request — a venue has one of those, meaning a guest at a table,
// and one name for two shapes in a single API document is a name for neither.
type ContactRequest struct {
	Company  string `json:"kompaniya" minLength:"1" maxLength:"120"`
	Name     string `json:"ism" minLength:"1" maxLength:"80"`
	Phone    string `json:"telefon" minLength:"5" maxLength:"30"`
	Email    string `json:"email,omitempty" maxLength:"120"`
	Size     *int32 `json:"hajmi,omitempty" minimum:"1" maximum:"100000"`
	Note     string `json:"izoh,omitempty" maxLength:"500"`
	Vertical string `json:"yonalish,omitempty" maxLength:"40"`
	Points   *int32 `json:"nuqtalar,omitempty" minimum:"1" maximum:"10000"`
}

func (s *Store) AskToBeContacted(ctx context.Context, in ContactRequest) error {
	_, err := s.queries.CreateTeamRequest(ctx, store.CreateTeamRequestParams{
		Company: in.Company, ContactName: in.Name, Phone: in.Phone,
		Email: optional(in.Email), TeamSize: in.Size, Note: optional(in.Note),
		Vertical: optional(in.Vertical), Points: in.Points,
	})
	return err
}
