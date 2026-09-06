package handles

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Writing a profile.

// SaveProfile writes an edit, having first read the row to find out what the
// owner is entitled to write.
func (s *Store) SaveProfile(ctx context.Context, normalized, userID string, in ProfileInput) (Handle, string, error) {
	current, err := s.ownedRow(ctx, normalized, userID)
	if err != nil {
		return Handle{}, "", err
	}

	// The plan comes from the row. A request that says "premium" is describing
	// itself, not granting itself anything.
	profile, problem := ReadProfile(in, ActivePlan(current.Plan, current.PlanExpiresAt, time.Now()))
	if problem != "" {
		return Handle{}, problem, ErrInvalid
	}

	links, err := json.Marshal(profile.Links)
	if err != nil {
		return Handle{}, "", err
	}
	services, err := json.Marshal(profile.Services)
	if err != nil {
		return Handle{}, "", err
	}
	visibility, err := json.Marshal(profile.Visibility)
	if err != nil {
		return Handle{}, "", err
	}
	music, err := json.Marshal(profile.Music)
	if err != nil {
		return Handle{}, "", err
	}
	var birthday pgtype.Date
	if profile.Birthday != nil {
		birthday = pgtype.Date{Time: *profile.Birthday, Valid: true}
	}

	id := *current.UserID
	row, err := s.queries.UpdateProfile(ctx, store.UpdateProfileParams{
		OwnerName:    &profile.Name,
		Bio:          optional(profile.Bio),
		Links:        links,
		Services:     services,
		City:         optional(profile.City),
		ContactEmail: optional(profile.ContactEmail),
		Phone:        optional(profile.Phone),
		Position:     optional(profile.Position),
		Company:      optional(profile.Company),
		Tags:         profile.Tags,
		CardDesign:   profile.CardDesign,
		DeviceType:   profile.DeviceType,
		AvatarUrl:    optional(profile.AvatarURL),
		BannerUrl:    optional(profile.BannerURL),
		CommentsOpen: profile.CommentsOpen,
		Yopiq:        profile.Private,
		Korinish:     visibility,
		TugilganKun:  birthday,
		StatusEmoji:  profile.StatusEmoji,
		Musiqa:       music,
		Normalized:   &normalized,
		UserID:       &id,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Handle{}, "", ErrNotFound
	}
	if err != nil {
		return Handle{}, "", err
	}

	return toHandle(row, nil), "", nil
}
