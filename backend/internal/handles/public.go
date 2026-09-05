package handles

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

// The profile a stranger sees.
//
// A separate type from Handle, and a separate query, because the difference is
// the point: an owner's row carries what they paid, who they are, when the
// plan lapses and which account holds it. None of that belongs on a page
// anybody with the address can open, and the safest way to keep it off is for
// the code that renders that page to have no way of asking for it.

// PublicProfile is what a visitor is shown.
type PublicProfile struct {
	Handle   string    `json:"raqam"`
	Name     string    `json:"ism"`
	Bio      string    `json:"tavsif,omitempty"`
	Avatar   string    `json:"rasm,omitempty"`
	Banner   string    `json:"banner,omitempty"`
	Links    []Link    `json:"havolalar"`
	Services []Service `json:"xizmatlar"`
	City     string    `json:"shahar,omitempty"`
	Email    string    `json:"email,omitempty"`
	Phone    string    `json:"telefon,omitempty"`
	Position string    `json:"lavozim,omitempty"`
	Company  string    `json:"kompaniya,omitempty"`
	Tags     []string  `json:"teglar"`

	Design string `json:"dizayn"`
	Device string `json:"qurilma,omitempty"`
	// The plan as it stands today, not the column. A lapsed premium row still
	// says "premium"; what a visitor should see is what is paid for now.
	Plan string `json:"tarif"`

	Views    int64      `json:"korishlar"`
	LastSeen *time.Time `json:"oxirgi_faollik,omitempty"`
}

// Public reads one claimed profile. A number that is unclaimed, reserved or
// invented is ErrNotFound — the same answer, because telling them apart tells
// somebody enumerating numbers which ones are worth a second look.
func (s *Store) Public(ctx context.Context, normalized string) (PublicProfile, error) {
	row, err := s.queries.PublicProfile(ctx, optional(normalized))
	if errors.Is(err, pgx.ErrNoRows) {
		return PublicProfile{}, ErrNotFound
	}
	if err != nil {
		return PublicProfile{}, err
	}

	return PublicProfile{
		Handle:   deref(row.Normalized),
		Name:     firstNonEmpty(deref(row.OwnerName), deref(row.Normalized)),
		Bio:      deref(row.Bio),
		Avatar:   deref(row.AvatarUrl),
		Banner:   deref(row.BannerUrl),
		Links:    decodeLinks(row.Links),
		Services: decodeServices(row.Services),
		City:     deref(row.City),
		Email:    deref(row.ContactEmail),
		Phone:    deref(row.Phone),
		Position: deref(row.Position),
		Company:  deref(row.Company),
		Tags:     row.Tags,
		Design:   CardDesign(row.CardDesign),
		Device:   DeviceType(row.DeviceType),
		Plan:     EffectivePlan(row.Plan, optionalTime(row.PlanExpiresAt)),
		Views:    row.ViewCount,
		LastSeen: optionalTime(row.LastSeenAt),
	}, nil
}

// A profile with no name on it is shown by its number rather than as a blank.
func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
