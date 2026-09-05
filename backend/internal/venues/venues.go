// Package venues is a cafe, a hotel or a shop: the menu it publishes, the
// points it has printed, and what a guest standing at one has asked for.
//
// Ownership is a filter on every statement, joined through `handles`, so a
// venue somebody else owns is no rows rather than a check made afterwards. The
// one exception is the counter link, where a long random token is the whole of
// the authorisation — it is what a waiter's phone has instead of an account.
package venues

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

var (
	ErrNotFound = errors.New("obyekt topilmadi")
	ErrInvalid  = errors.New("noto'g'ri ma'lumot")
)

type Store struct {
	pool    *pgxpool.Pool
	queries *store.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool, queries: store.New(pool)}
}

// Venue is the place itself.
type Venue struct {
	ID      string   `json:"id"`
	Handle  string   `json:"raqam,omitempty"`
	Name    string   `json:"nom"`
	Kind    string   `json:"turi" enum:"cafe,hotel,shop,other"`
	Hours   string   `json:"ish_vaqti,omitempty"`
	Address string   `json:"manzil,omitempty"`
	Wifi    string   `json:"wifi,omitempty"`
	Points  []string `json:"nuqtalar"`

	// Only ever sent to the owner, or to a guest standing at a point. A wifi
	// password on a public profile is a wifi password on the street.
	WifiPassword string `json:"wifi_paroli,omitempty"`
	// The secret in the counter link. Owner only, and never on a menu.
	StaffToken string     `json:"xodim_kaliti,omitempty"`
	PlanExpiry *time.Time `json:"tarif_tugashi,omitempty"`
}

// Item is one line on a menu.
type Item struct {
	ID        string `json:"id"`
	Category  string `json:"bolim,omitempty"`
	Name      string `json:"nom"`
	Note      string `json:"izoh,omitempty"`
	Price     int64  `json:"narx"`
	Available bool   `json:"bor"`
	Photo     string `json:"rasm,omitempty"`
	Position  int32  `json:"tartib"`

	// The other two languages, sent only to the screen that edits this row.
	// An editor shown one language would overwrite the other two with blanks
	// the first time somebody saved.
	NameRu string `json:"nom_ru,omitempty"`
	NameEn string `json:"nom_en,omitempty"`
	NoteRu string `json:"izoh_ru,omitempty"`
	NoteEn string `json:"izoh_en,omitempty"`
}

// Category groups items. Its own type because a menu is drawn as sections.
type Category struct {
	ID       string `json:"id"`
	Name     string `json:"nom"`
	Position int32  `json:"tartib"`
	Items    []Item `json:"taomlar"`

	NameRu string `json:"nom_ru,omitempty"`
	NameEn string `json:"nom_en,omitempty"`
}

// Request is a guest at a point asking for something.
type Request struct {
	ID     string     `json:"id"`
	Point  string     `json:"nuqta"`
	Kind   string     `json:"turi"`
	Rating *int16     `json:"baho,omitempty"`
	Note   string     `json:"izoh,omitempty"`
	Status string     `json:"holat"`
	At     time.Time  `json:"vaqt"`
	DoneAt *time.Time `json:"bajarilgan,omitempty"`
}

// pick is the translation that exists.
//
// A cafe types its menu once, in the language it thinks in. Asking for three
// versions of every dish before anything can be published would mean no menus
// at all, so the other two are optional and this falls back rather than
// showing an empty line.
func pick(base string, ru, en *string, lang string) string {
	switch lang {
	case "ru":
		if ru != nil && strings.TrimSpace(*ru) != "" {
			return *ru
		}
	case "en":
		if en != nil && strings.TrimSpace(*en) != "" {
			return *en
		}
	}
	return base
}

// NewStaffToken is what goes in the counter link.
//
// Long, because it is the whole of the authorisation: a waiter's phone has
// this instead of an account, and a guessable one is an open till.
func NewStaffToken() (string, error) {
	raw := make([]byte, 24)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

func toVenue(v store.Venue, forOwner bool) Venue {
	out := Venue{
		ID:      v.ID.String(),
		Name:    v.Name,
		Kind:    v.Kind,
		Hours:   deref(v.Hours),
		Address: deref(v.Address),
		Wifi:    deref(v.WifiName),
		Points:  v.Points,
	}
	if forOwner {
		out.WifiPassword = deref(v.WifiPassword)
		out.StaffToken = deref(v.StaffToken)
		out.PlanExpiry = optionalTime(v.PlanExpiresAt)
	}
	return out
}

// ByHandle reads a venue for anybody. The owner's secrets are left off.
func (s *Store) ByHandle(ctx context.Context, handle string) (Venue, error) {
	row, err := s.queries.VenueByHandle(ctx, &handle)
	if errors.Is(err, pgx.ErrNoRows) {
		return Venue{}, ErrNotFound
	}
	if err != nil {
		return Venue{}, err
	}
	return toVenue(row, false), nil
}

// Owned reads it as its owner, secrets and all.
func (s *Store) Owned(ctx context.Context, handle, userID string) (Venue, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Venue{}, ErrNotFound
	}

	row, err := s.queries.OwnedVenue(ctx, store.OwnedVenueParams{Handle: &handle, UserID: &owner})
	if errors.Is(err, pgx.ErrNoRows) {
		return Venue{}, ErrNotFound
	}
	if err != nil {
		return Venue{}, err
	}
	return toVenue(row, true), nil
}

// ByStaffToken is the counter link. The token is the authorisation.
func (s *Store) ByStaffToken(ctx context.Context, token string) (Venue, error) {
	row, err := s.queries.VenueByStaffToken(ctx, &token)
	if errors.Is(err, pgx.ErrNoRows) {
		return Venue{}, ErrNotFound
	}
	if err != nil {
		return Venue{}, err
	}

	venue := toVenue(store.Venue{
		ID: row.ID, HandleID: row.HandleID, Name: row.Name, Kind: row.Kind,
		Hours: row.Hours, Address: row.Address, WifiName: row.WifiName,
		WifiPassword: row.WifiPassword, Points: row.Points,
		StaffToken: row.StaffToken, PlanExpiresAt: row.PlanExpiresAt,
	}, true)
	venue.Handle = deref(row.Normalized)
	return venue, nil
}

// Menu is the whole thing, in one language, grouped as it is drawn.
func (s *Store) Menu(ctx context.Context, venueID uuid.UUID, lang string) ([]Category, error) {
	categories, err := s.queries.MenuCategories(ctx, venueID)
	if err != nil {
		return nil, err
	}
	items, err := s.queries.MenuItems(ctx, venueID)
	if err != nil {
		return nil, err
	}

	byCategory := map[string][]Item{}
	for _, i := range items {
		item := Item{
			ID:        i.ID.String(),
			Name:      pick(i.Name, i.NameRu, i.NameEn, lang),
			Note:      pick(deref(i.Note), i.NoteRu, i.NoteEn, lang),
			Price:     i.Price,
			Available: i.Available,
			Photo:     deref(i.PhotoUrl),
			Position:  i.Position,
		}
		key := ""
		if i.CategoryID != nil {
			key = i.CategoryID.String()
			item.Category = key
		}
		byCategory[key] = append(byCategory[key], item)
	}

	out := make([]Category, 0, len(categories)+1)
	for _, c := range categories {
		out = append(out, Category{
			ID:       c.ID.String(),
			Name:     pick(c.Name, c.NameRu, c.NameEn, lang),
			Position: c.Position,
			Items:    byCategory[c.ID.String()],
		})
	}
	// Dishes typed before any section existed. Shown rather than hidden: a
	// menu that silently drops what somebody entered is worse than an
	// unnamed group.
	if loose := byCategory[""]; len(loose) > 0 {
		out = append(out, Category{Name: "", Items: loose})
	}
	return out, nil
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func optionalTime(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	at := t.Time
	return &at
}

func optional(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// Tab is the cabinet's venue tab: which number, and how many tables waiting.
type Tab struct {
	Handle  string `json:"raqam"`
	Waiting int64  `json:"kutilmoqda"`
}

// MyTab returns nothing when the account has no venue, which is the normal
// case: most people who own a number do not run a cafe.
func (s *Store) MyTab(ctx context.Context, userID string) (Tab, bool) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Tab{}, false
	}

	row, err := s.queries.MyVenueTab(ctx, &owner)
	if err != nil {
		return Tab{}, false
	}
	return Tab{Handle: deref(row.Normalized), Waiting: row.Waiting}, true
}
