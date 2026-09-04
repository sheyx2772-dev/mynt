package handles

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

var (
	// ErrNotFound is what a number somebody does not own returns, and what an
	// invented one returns. The same answer on purpose.
	ErrNotFound = errors.New("raqam topilmadi")
	// ErrInvalid carries a sentence for the person who sent the request.
	ErrInvalid = errors.New("noto'g'ri ma'lumot")
)

// Store is everything this package does that touches the database. Named for
// what it is rather than "Service", which in this package already means a line
// on somebody's price list.
type Store struct {
	pool    *pgxpool.Pool
	queries *store.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool, queries: store.New(pool)}
}

// Handle is one number as the outside world sees it.
//
// A separate type from the row rather than the row with tags on it: the row
// carries `plan_reminded_for`, `custom_design_url` and `gift_reason`, which are
// how the business runs and none of the owner's business to be shown. A struct
// that has to be filled in field by field cannot leak a column somebody adds
// later.
type Handle struct {
	Normalized string    `json:"raqam" example:"MYN042"`
	Status     string    `json:"holat" enum:"available,reserved,claimed"`
	Name       string    `json:"ism"`
	Bio        string    `json:"bio"`
	AvatarURL  string    `json:"rasm,omitempty"`
	Links      []Link    `json:"havolalar"`
	Services   []Service `json:"xizmatlar"`

	City         string   `json:"shahar,omitempty"`
	ContactEmail string   `json:"email,omitempty"`
	Phone        string   `json:"telefon,omitempty"`
	Position     string   `json:"lavozim,omitempty"`
	Company      string   `json:"kompaniya,omitempty"`
	Tags         []string `json:"teglar"`

	CardDesign string `json:"dizayn"`
	DeviceType string `json:"qurilma" enum:"card,ring,bracelet"`

	// The plan in force right now, which is not always the column: a lapsed
	// premium reads as free here so that nothing downstream has to remember why.
	Plan      string `json:"tarif" enum:"free,premium"`
	ViewCount int64  `json:"korishlar"`

	ClaimedAt *time.Time `json:"olingan,omitempty"`
}

// ActivePlan is the rule about a lapsed subscription, in one place.
func ActivePlan(stored string, expires pgtype.Timestamptz, now time.Time) string {
	if stored != PlanPremium || !expires.Valid {
		return PlanFree
	}
	if expires.Time.After(now) {
		return PlanPremium
	}
	return PlanFree
}

func toHandle(row store.Handle) Handle {
	return Handle{
		Normalized:   deref(row.Normalized),
		Status:       row.Status,
		Name:         deref(row.OwnerName),
		Bio:          deref(row.Bio),
		AvatarURL:    deref(row.AvatarUrl),
		Links:        decodeLinks(row.Links),
		Services:     decodeServices(row.Services),
		City:         deref(row.City),
		ContactEmail: deref(row.ContactEmail),
		Phone:        deref(row.Phone),
		Position:     deref(row.Position),
		Company:      deref(row.Company),
		Tags:         row.Tags,
		CardDesign:   row.CardDesign,
		DeviceType:   row.DeviceType,
		Plan:         ActivePlan(row.Plan, row.PlanExpiresAt, time.Now()),
		ViewCount:    row.ViewCount,
		ClaimedAt:    optionalTime(row.ClaimedAt),
	}
}

// ForUser is everything the signed-in account owns or is holding.
func (s *Store) ForUser(ctx context.Context, userID string) ([]Handle, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.queries.HandlesForUser(ctx, &id)
	if err != nil {
		return nil, err
	}

	// An empty slice rather than nil: the difference is `[]` and `null` in the
	// response, and a client that has to handle both handles one of them badly.
	out := make([]Handle, 0, len(rows))
	for _, row := range rows {
		out = append(out, toHandle(row))
	}
	return out, nil
}

// Owned reads a number under its owner's id, which is the authorization.
func (s *Store) Owned(ctx context.Context, normalized, userID string) (Handle, error) {
	row, err := s.ownedRow(ctx, normalized, userID)
	if err != nil {
		return Handle{}, err
	}
	return toHandle(row), nil
}

func (s *Store) ownedRow(ctx context.Context, normalized, userID string) (store.Handle, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return store.Handle{}, ErrNotFound
	}

	row, err := s.queries.OwnedHandle(ctx, store.OwnedHandleParams{
		Normalized: &normalized,
		UserID:     &id,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return store.Handle{}, ErrNotFound
	}
	return row, err
}
