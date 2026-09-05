package notify

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// What somebody finds in their cabinet.
//
// The list is the durable half of a notice: Telegram may have been down, the
// message may have scrolled away, the phone may be new. This is the copy that
// stays.

// Stored is one recorded notice.
type Stored struct {
	ID        int64      `json:"id"`
	Kind      string     `json:"tur"`
	Handle    string     `json:"raqam,omitempty"`
	Title     string     `json:"sarlavha"`
	Body      string     `json:"matn,omitempty"`
	Href      string     `json:"havola,omitempty"`
	ReadAt    *time.Time `json:"oqilgan,omitempty"`
	CreatedAt time.Time  `json:"vaqt"`
}

// A screen, not an archive. Somebody with two thousand notices is not going to
// scroll them, and a page that fetches them all is a page that stops loading.
const pageSize = 50

// List returns the newest notices for one account.
func (s *Service) List(ctx context.Context, userID string) ([]Stored, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	rows, err := s.queries.Notices(ctx, store.NoticesParams{
		UserID: owner, PageSize: pageSize, Skip: 0,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Stored, 0, len(rows))
	for _, row := range rows {
		out = append(out, Stored{
			ID:        row.ID,
			Kind:      row.Kind,
			Handle:    deref(row.Handle),
			Title:     row.Title,
			Body:      deref(row.Body),
			Href:      deref(row.Href),
			ReadAt:    optionalTime(row.ReadAt),
			CreatedAt: row.CreatedAt.Time,
		})
	}
	return out, nil
}

// Unread is the number on the badge.
func (s *Service) Unread(ctx context.Context, userID string) (int64, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return 0, err
	}
	return s.queries.CountUnread(ctx, owner)
}

// MarkAllRead clears the badge.
//
// Everything unread at once rather than one row at a time: the cabinet shows a
// list, and marking each is a request per row for a screen already read.
func (s *Service) MarkAllRead(ctx context.Context, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	return s.queries.MarkNoticesRead(ctx, owner)
}
