package leads

import (
	"context"
	"errors"
	"net/netip"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

var (
	// ErrNoHandle is what an unclaimed or invented number gives. The caller
	// answers it the same way it answers a rate limit — see Leave.
	ErrNoHandle = errors.New("raqam topilmadi")
	// ErrTooMany is a refusal the visitor is told about, because unlike a
	// sign-in link there is nothing here to disclose: the profile is public,
	// and somebody typing their number into a form knows they typed it.
	ErrTooMany = errors.New("juda ko'p urinish")
)

type Store struct {
	queries *store.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{queries: store.New(pool)}
}

// Leave records a contact somebody left on a profile.
//
// `normalized` has already been parsed into our own form by the caller; the
// rest of the input is whatever arrived, and goes through Read first.
func (s *Store) Leave(ctx context.Context, normalized string, in Input, ip *netip.Addr) (string, error) {
	checked, problem := Read(in)
	if problem != "" {
		return problem, nil
	}

	allowed, err := s.allowed(ctx, normalized, ip)
	if err != nil {
		return "", err
	}
	if !allowed {
		s.record(ctx, normalized, ip, false)
		return "", ErrTooMany
	}

	_, err = s.queries.CreateLead(ctx, store.CreateLeadParams{
		Name:       checked.Name,
		Phone:      optional(checked.Phone),
		Email:      optional(checked.Email),
		Company:    optional(checked.Company),
		Note:       optional(checked.Note),
		Source:     optional(checked.Source),
		Normalized: &normalized,
	})

	// The insert selects the handle by number and status, so no rows means the
	// number is not claimed — there is nobody for this contact to reach.
	if errors.Is(err, pgx.ErrNoRows) {
		s.record(ctx, normalized, ip, false)
		return "", ErrNoHandle
	}
	if err != nil {
		s.record(ctx, normalized, ip, false)
		return "", err
	}

	s.record(ctx, normalized, ip, true)
	return "", nil
}

// Owner is who a number belongs to, for telling them a contact arrived.
//
// Returns an empty string rather than an error when nobody holds it: a notice
// with no recipient is not a failure of the thing that caused it.
func (s *Store) Owner(ctx context.Context, normalized string) string {
	owner, err := s.queries.HandleOwner(ctx, &normalized)
	if err != nil || owner == nil {
		return ""
	}
	return owner.String()
}

// ForOwner lists what one number has been sent. The ownership filter is inside
// the query, joined through `handles`, so a number somebody else owns returns
// nothing rather than being checked for afterwards.
func (s *Store) ForOwner(ctx context.Context, normalized, userID string) ([]Lead, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNoHandle
	}

	rows, err := s.queries.LeadsForHandle(ctx, store.LeadsForHandleParams{
		Normalized: &normalized,
		UserID:     &owner,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Lead, 0, len(rows))
	for _, row := range rows {
		out = append(out, Lead{
			ID:        row.ID,
			Name:      row.Name,
			Phone:     deref(row.Phone),
			Email:     deref(row.Email),
			Company:   deref(row.Company),
			Note:      deref(row.Note),
			Source:    deref(row.Source),
			CreatedAt: row.CreatedAt.Time,
		})
	}
	return out, nil
}

// Delete removes one contact. A person may ask for their details to be taken
// off a card they left them on, and the owner has to be able to do it.
func (s *Store) Delete(ctx context.Context, normalized, userID string, id int64) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNoHandle
	}

	affected, err := s.queries.DeleteLead(ctx, store.DeleteLeadParams{
		ID:         id,
		Normalized: &normalized,
		UserID:     &owner,
	})
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrNoHandle
	}
	return nil
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
