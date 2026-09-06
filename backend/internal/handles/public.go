package handles

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
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

	Views     int64      `json:"korishlar"`
	Followers int64      `json:"obunachilar"`
	LastSeen  *time.Time `json:"oxirgi_faollik,omitempty"`

	// Closed: a stranger sees the name, the picture and the number, and the
	// rest after the owner has accepted them. See ForStranger.
	Private bool `json:"yopiq"`

	// Whether the reader owns this number.
	//
	// A boolean rather than the owner's id, which is what the website used to
	// read. This endpoint is public, so publishing the id would let anybody
	// group numbers by the person holding them — which is a fact about a
	// customer that a stranger tapping a card has no business learning. The
	// question every caller actually asked was this one.
	Mine bool `json:"meniki"`

	// What the reader has already done here. On the profile rather than behind
	// two more requests, because the page that draws the buttons is this one
	// and it would otherwise ask three times for one screen.
	Following   bool `json:"obunaman"`
	Recommended bool `json:"tavsiya_qilganman"`
	// Asked a closed profile and not yet answered. Drawn as "so'rov yuborildi".
	Pending bool `json:"sorov_kutilmoqda"`
}

// Public reads one claimed profile. A number that is unclaimed, reserved or
// invented is ErrNotFound — the same answer, because telling them apart tells
// somebody enumerating numbers which ones are worth a second look.
func (s *Store) Public(ctx context.Context, normalized, viewerID string) (PublicProfile, error) {
	row, err := s.queries.PublicProfile(ctx, optional(normalized))
	if errors.Is(err, pgx.ErrNoRows) {
		return PublicProfile{}, ErrNotFound
	}
	if err != nil {
		return PublicProfile{}, err
	}

	// Compared here rather than returned for the caller to compare, so the
	// owner's id never leaves this function.
	mine := viewerID != "" && row.UserID != nil && row.UserID.String() == viewerID

	return PublicProfile{
		Mine:     mine,
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
		Views:     row.ViewCount,
		Followers: row.FollowerCount,
		LastSeen:  optionalTime(row.LastSeenAt),
		Private:   row.Yopiq,
	}, nil
}

// ForStranger is the closed profile as somebody outside it sees it.
//
// Cut here, on the server, rather than hidden by the page: a field that is
// hidden is still in the response, and a response is a file anybody can read.
// What survives is what a locked account shows on the networks people already
// use — who this is, what they look like, how many follow them — and nothing
// that would let a stranger reach them.
//
// A no-op for an open profile, for the owner, and for an accepted follower,
// so the route can call it unconditionally once it knows all three.
func (p PublicProfile) ForStranger(following bool) PublicProfile {
	if !p.Private || p.Mine || following {
		return p
	}
	return PublicProfile{
		Handle:    p.Handle,
		Name:      p.Name,
		Avatar:    p.Avatar,
		Banner:    p.Banner,
		Design:    p.Design,
		Plan:      p.Plan,
		Followers: p.Followers,
		Private:   true,
		Mine:      false,
		Following: false,
		// The one thing a stranger is told about their own standing: that
		// they asked and are waiting. Without it the button offers to ask
		// again the moment the page reloads.
		Pending: p.Pending,
		// Empty rather than nil, so the JSON says [] and a client that
		// iterates does not have to guard against null.
		Links:    []Link{},
		Services: []Service{},
		Tags:     []string{},
	}
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

// GenesisCard is one of the numbered first-run cards.
//
// A different namespace from a handle and not interchangeable with one: a
// serial is six digits, a handle is three letters and three digits, and the
// page that shows a card is not the page that shows a profile.
type GenesisCard struct {
	Serial string     `json:"seriya"`
	Status string     `json:"holat"`
	Name   string     `json:"ism,omitempty"`
	Handle string     `json:"raqam,omitempty"`
	Minted *time.Time `json:"chiqarilgan,omitempty"`
}

// Genesis reads one card by its serial.
func (s *Store) Genesis(ctx context.Context, serial string) (GenesisCard, error) {
	row, err := s.queries.GenesisCard(ctx, optional(serial))
	if errors.Is(err, pgx.ErrNoRows) {
		return GenesisCard{}, ErrNotFound
	}
	if err != nil {
		return GenesisCard{}, err
	}

	return GenesisCard{
		Serial: deref(row.Normalized),
		Status: row.Status,
		Name:   deref(row.OwnerName),
		Handle: deref(row.OwnerHandle),
		Minted: optionalTime(row.MintedAt),
	}, nil
}

// TouchLastSeen stamps every number this account holds as recently active.
//
// Called from the cabinet, which is the one page only an owner loads — so a
// profile showing "seen two days ago" means the owner opened their cabinet
// rather than that somebody looked at the profile.
func (s *Store) TouchLastSeen(ctx context.Context, userID string) error {
	id, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return s.queries.TouchLastSeen(ctx, &id)
}

// DesignRequest is a buyer asking for a card to be drawn for them.
type DesignRequest struct {
	ID      string
	Handle  string
	Wish    string
	Status  string
	Image   string
	Note    string
	Created string
}

func (s *Store) DesignRequests(ctx context.Context, handle, userID string) ([]DesignRequest, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.queries.DesignRequests(ctx, store.DesignRequestsParams{
		Handle: handle, UserID: owner,
	})
	if err != nil {
		return nil, err
	}

	out := make([]DesignRequest, 0, len(rows))
	for _, row := range rows {
		out = append(out, DesignRequest{
			ID: row.ID.String(), Handle: row.Handle, Wish: row.Wish,
			Status: row.Status, Image: deref(row.ImageUrl), Note: deref(row.Note),
			Created: row.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return out, nil
}

func (s *Store) AskForDesign(ctx context.Context, handle, userID, wish string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}

	_, err = s.queries.CreateDesignRequest(ctx, store.CreateDesignRequestParams{
		Handle: &handle, UserID: owner, Wish: wish,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}
