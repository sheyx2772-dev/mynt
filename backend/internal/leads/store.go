package leads

import (
	"time"

	"context"
	"errors"
	"github.com/jackc/pgx/v5/pgtype"
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
	// A contact the owner typed in themselves, with nothing usable in it.
	ErrBadLead = errors.New("noto'g'ri ma'lumot")
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

			Stage:       row.Status,
			OwnerNote:   deref(row.OwnerNote),
			FollowUpOn:  dateOnly(row.FollowUpOn),
			LastTouchAt: rfc3339(row.LastTouchAt),
			Tags:        row.Tags,
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

// Patch is the owner's own side of a contact: where it has got to, what they
// noted, when to chase it. The lead itself — the name and number somebody
// left — is not editable, because it is a record of what was said rather than
// a field.
type Patch struct {
	Stage      string   `json:"holat,omitempty" enum:"new,talking,client,cold"`
	OwnerNote  string   `json:"izoh,omitempty" maxLength:"1000"`
	FollowUpOn string   `json:"eslatma,omitempty" format:"date"`
	Tags       []string `json:"teglar,omitempty" maxItems:"10"`
}

// Update changes the owner's side of one contact.
//
// `last_touch_at` is deliberately not set here: a trigger stamps it from the
// same statement, so the clock cannot disagree with the change that moved it.
func (s *Store) Update(ctx context.Context, id int64, userID string, in Patch) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNoHandle
	}

	var followUp pgtype.Date
	if in.FollowUpOn != "" {
		if at, err := time.Parse(time.DateOnly, in.FollowUpOn); err == nil {
			followUp = pgtype.Date{Time: at, Valid: true}
		}
	}

	rows, err := s.queries.UpdateLead(ctx, store.UpdateLeadParams{
		ID: id, UserID: &owner,
		Status: optional(in.Stage), OwnerNote: optional(in.OwnerNote),
		FollowUpOn: followUp, Tags: in.Tags,
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNoHandle
	}
	return nil
}

// Add is somebody the owner met and typed in themselves, rather than one who
// filled in the form. The same table: a contact is a contact.
func (s *Store) Add(ctx context.Context, handle, userID string, in Input) (int64, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return 0, ErrNoHandle
	}

	checked, problem := Read(in)
	if problem != "" {
		return 0, ErrBadLead
	}

	id, err := s.queries.AddLeadByOwner(ctx, store.AddLeadByOwnerParams{
		Handle: &handle, UserID: &owner,
		Name: checked.Name, Phone: optional(checked.Phone), Email: optional(checked.Email),
		Company: optional(checked.Company), Note: optional(checked.Note),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNoHandle
	}
	return id, err
}

// Brief is a summary the owner has had built over their contacts, kept so the
// page does not rebuild it on every visit.
type Brief struct {
	Summary     string `json:"xulosa" maxLength:"4000"`
	Suggestions string `json:"takliflar" maxLength:"20000" doc:"JSON"`
	Seen        int32  `json:"korilgan"`
	BuiltAt     string `json:"tuzilgan,omitempty"`
}

func (s *Store) Brief(ctx context.Context, handle, userID string) (Brief, bool) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Brief{}, false
	}

	row, err := s.queries.Brief(ctx, store.BriefParams{Handle: &handle, UserID: &owner})
	if err != nil {
		return Brief{}, false
	}

	brief := Brief{
		Summary:     row.Summary,
		Suggestions: string(row.Suggestions),
		Seen:        row.ContactsSeen,
	}
	if row.BuiltAt.Valid {
		brief.BuiltAt = row.BuiltAt.Time.Format(time.RFC3339)
	}
	return brief, true
}

func (s *Store) SaveBrief(ctx context.Context, handle, userID string, in Brief) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNoHandle
	}
	return s.queries.SaveBrief(ctx, store.SaveBriefParams{
		Handle: &handle, UserID: &owner,
		Summary: in.Summary, Suggestions: []byte(in.Suggestions), ContactsSeen: in.Seen,
	})
}

func (s *Store) DeleteBrief(ctx context.Context, handle, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNoHandle
	}
	return s.queries.DeleteBrief(ctx, store.DeleteBriefParams{Handle: &handle, UserID: &owner})
}

// A date the owner set, written the way a date input reads it.
func dateOnly(d pgtype.Date) string {
	if !d.Valid {
		return ""
	}
	return d.Time.Format(time.DateOnly)
}

func rfc3339(t pgtype.Timestamptz) string {
	if !t.Valid {
		return ""
	}
	return t.Time.Format(time.RFC3339)
}
