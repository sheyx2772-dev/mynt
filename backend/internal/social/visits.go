package social

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Kim ko'rdi: the signed-in people who opened a profile, and the switch that
// keeps a person out of every such list.

// Viewer is one person who looked.
type Viewer struct {
	Handle string    `json:"raqam,omitempty"`
	Name   string    `json:"ism"`
	Avatar string    `json:"rasm,omitempty"`
	At     time.Time `json:"vaqt"`
	Times  int32     `json:"marta"`
}

// RecordVisit notes that an account opened a profile. Never fails a page:
// the profile has already been sent by the time this runs.
func (s *Store) RecordVisit(ctx context.Context, handle, viewerID string) {
	id, err := uuid.Parse(viewerID)
	if err != nil {
		return
	}
	_ = s.queries.RecordVisit(ctx, store.RecordVisitParams{Handle: handle, ViewerID: id})
}

// Viewers lists who looked, newest first, for the owner.
func (s *Store) Viewers(ctx context.Context, handle, ownerID string, limit int32) ([]Viewer, error) {
	owner, err := uuid.Parse(ownerID)
	if err != nil {
		return []Viewer{}, nil
	}
	rows, err := s.queries.Viewers(ctx, store.ViewersParams{OwnerID: &owner, Handle: handle, PageSize: limit})
	if err != nil {
		return nil, err
	}
	out := make([]Viewer, 0, len(rows))
	for _, r := range rows {
		out = append(out, Viewer{
			Handle: deref(r.ViewerHandle),
			Name:   firstNonEmpty(deref(r.ViewerName), "Raqamsiz foydalanuvchi"),
			Avatar: deref(r.ViewerAvatar),
			At:     r.LastAt.Time,
			Times:  r.Soni,
		})
	}
	return out, nil
}

// CountViewers is how many distinct accounts looked in the last `days`.
func (s *Store) CountViewers(ctx context.Context, handle, ownerID string, days int32) int64 {
	owner, err := uuid.Parse(ownerID)
	if err != nil {
		return 0
	}
	n, err := s.queries.CountViewers(ctx, store.CountViewersParams{OwnerID: &owner, Handle: handle, Days: days})
	if err != nil {
		return 0
	}
	return n
}

// Invisible reports whether this account asked to stay out of every list.
func (s *Store) Invisible(ctx context.Context, userID string) bool {
	id, err := uuid.Parse(userID)
	if err != nil {
		return false
	}
	v, err := s.queries.IsInvisible(ctx, id)
	return err == nil && v
}

// SetInvisible flips the switch, and going invisible forgets what was
// already written about this account.
func (s *Store) SetInvisible(ctx context.Context, userID string, invisible bool) error {
	id, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	if err := s.queries.SetInvisible(ctx, store.SetInvisibleParams{UserID: id, Korinmas: invisible}); err != nil {
		return err
	}
	if invisible {
		return s.queries.ForgetVisits(ctx, id)
	}
	return nil
}
