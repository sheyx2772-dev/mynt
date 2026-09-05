// Package teams is a company: the numbers it holds, the people who hold them,
// and what it is billed.
//
// Membership is the authorisation everywhere here, and it comes in two grades.
// A member holds a number and edits its profile; the owner takes numbers back,
// hands them out, and changes what goes on an invoice. Those are different
// statements rather than one with a flag, because the difference between them
// is somebody's bank details.
package teams

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/auth"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

var ErrNotFound = errors.New("jamoa topilmadi")

// Directory is where an account is found or made. The same seam the sign-in
// doors use: assigning a number to an address that has never been here creates
// the account, and following the link is what proves it.
type Directory interface {
	FindOrCreate(ctx context.Context, email string) (auth.Account, error)
}

type Store struct {
	pool      *pgxpool.Pool
	queries   *store.Queries
	directory Directory
}

func NewStore(pool *pgxpool.Pool, directory Directory) *Store {
	return &Store{pool: pool, queries: store.New(pool), directory: directory}
}

type Team struct {
	ID   string `json:"id"`
	Name string `json:"nom"`
	Role string `json:"rol" enum:"owner,member"`
	// What goes on an invoice. Owner only.
	LegalName string `json:"yuridik_nom,omitempty"`
	INN       string `json:"inn,omitempty"`
	Address   string `json:"manzil,omitempty"`
	Bank      string `json:"bank,omitempty"`
	Account   string `json:"hisob,omitempty"`
	MFO       string `json:"mfo,omitempty"`
	Director  string `json:"rahbar,omitempty"`

	Seats      int32      `json:"orinlar"`
	PlanExpiry *time.Time `json:"tarif_tugashi,omitempty"`
}

// Seat is one of the company's numbers and who is holding it.
//
// Not called Handle: a company's view of a number carries who is holding it
// and nothing about the profile, and the two types in one API document would
// be one name for two shapes.
type Seat struct {
	Number   string `json:"raqam"`
	Name     string `json:"ism,omitempty"`
	Position string `json:"lavozim,omitempty"`
	Views    int64  `json:"korishlar"`
	Status   string `json:"holat"`
	Holder   string `json:"kimda,omitempty"`
	// Empty while the number is back in the company's pool, which is what the
	// screen draws differently.
	Assigned bool       `json:"berilgan"`
	Taken    *time.Time `json:"olingan,omitempty"`
}

type Stats struct {
	Taken    int64 `json:"olingan"`
	Assigned int64 `json:"berilgan"`
	Views    int64 `json:"korishlar"`
}

func (s *Store) ForUser(ctx context.Context, userID string) (Team, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return Team{}, ErrNotFound
	}

	row, err := s.queries.TeamForUser(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrNotFound
	}
	if err != nil {
		return Team{}, err
	}

	team := Team{
		ID: row.ID.String(), Name: row.Name, Role: row.Role,
		Seats: row.Seats, PlanExpiry: optionalTime(row.PlanExpiresAt),
	}
	// The requisites are the owner's business: a member holding a number has
	// no reason to see the company's bank account.
	if row.Role == "owner" {
		team.LegalName = deref(row.LegalName)
		team.INN = deref(row.Inn)
		team.Address = deref(row.Address)
		team.Bank = deref(row.BankName)
		team.Account = deref(row.BankAccount)
		team.MFO = deref(row.BankMfo)
		team.Director = deref(row.Director)
	}
	return team, nil
}

func (s *Store) Seats(ctx context.Context, teamID uuid.UUID) ([]Seat, error) {
	rows, err := s.queries.TeamHandles(ctx, &teamID)
	if err != nil {
		return nil, err
	}

	out := make([]Seat, 0, len(rows))
	for _, row := range rows {
		out = append(out, Seat{
			Number: deref(row.Normalized), Name: deref(row.OwnerName),
			Position: deref(row.Position), Views: row.ViewCount,
			Status: row.Status, Holder: deref(row.Holder),
			Assigned: row.UserID != nil,
			Taken:    optionalTime(row.ClaimedAt),
		})
	}
	return out, nil
}

func (s *Store) Stats(ctx context.Context, teamID uuid.UUID) (Stats, error) {
	row, err := s.queries.TeamStats(ctx, &teamID)
	if err != nil {
		return Stats{}, err
	}
	return Stats{Taken: row.Taken, Assigned: row.Assigned, Views: row.Views}, nil
}

// Release takes a number back from somebody who has left. The number stays
// with the company; only the holder is cleared.
func (s *Store) Release(ctx context.Context, handle, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.ReleaseTeamHandle(ctx, store.ReleaseTeamHandleParams{
		Handle: &handle, UserID: owner,
	}))
}

var (
	ErrOccupied = errors.New("raqam band")
	ErrNoSeats  = errors.New("bo'sh o'rin yo'q")
)

// Assign hands a number to somebody, by address.
//
// By address rather than by account id because the person may not have one
// yet: buying numbers for a team and mailing them out is the ordinary case.
// The account is created if it does not exist — following the link is what
// proves the address, exactly as the sign-in door works.
//
// Three rules, and all three are in the statement rather than checked after:
// the number is this company's, it is nobody's, and there is a seat free.
func (s *Store) Assign(ctx context.Context, handle, userID, toEmail string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}

	row, err := s.queries.TeamHandleForAssign(ctx, store.TeamHandleForAssignParams{
		Handle: &handle, UserID: owner,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if row.UserID != nil {
		return ErrOccupied
	}
	if row.Filled >= int64(row.Seats) {
		return ErrNoSeats
	}

	account, err := s.directory.FindOrCreate(ctx, toEmail)
	if err != nil {
		return err
	}
	to, err := uuid.Parse(account.ID)
	if err != nil {
		return err
	}

	return rowsOrNotFound(s.queries.AssignTeamHandle(ctx, store.AssignTeamHandleParams{
		Handle: &handle, UserID: owner, ToUser: &to,
	}))
}

func rowsOrNotFound(rows int64, err error) error {
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func optional(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func optionalTime(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	at := t.Time
	return &at
}

func numericToInt32(n pgtype.Numeric) int32 {
	if !n.Valid || n.Int == nil {
		return 0
	}
	v, err := n.Int64Value()
	if err != nil || !v.Valid {
		return 0
	}
	return int32(v.Int64)
}

func int32ToNumeric(v int32) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(strconv.Itoa(int(v)))
	return n
}
