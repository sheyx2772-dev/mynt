package admin

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// The made-to-order design queue.
//
// A buyer describes the card they want, somebody draws it, and the result is
// filed against their number. The drawing happens outside this process — the
// operator runs a generator and commits the image with the site — so what is
// here is the queue and the two ways out of it.

// ErrNotWaiting is a request that has already been filled or refused. Somebody
// else got there first, or the same person pressed twice.
var ErrNotWaiting = errors.New("bu so'rov navbatda emas")

// QueuedDesign is one card somebody asked for, as the operator sees it.
type QueuedDesign struct {
	ID     string `json:"id"`
	Handle string `json:"raqam"`
	Wish   string `json:"tilagi"`
	// The prompt assembled from what they asked for, ready to paste into a
	// generator. Written when the request was made, so what is drawn is what
	// was described rather than what somebody remembered of it.
	Prompt  string    `json:"buyruq,omitempty"`
	Status  string    `json:"holat"`
	Image   string    `json:"rasm,omitempty"`
	Note    string    `json:"izoh,omitempty"`
	Created time.Time `json:"vaqt"`
}

func toRequest(row store.DesignRequest) QueuedDesign {
	return QueuedDesign{
		ID: row.ID.String(), Handle: row.Handle, Wish: row.Wish,
		Prompt: row.Prompt, Status: row.Status,
		Image: deref(row.ImageUrl), Note: deref(row.Note),
		Created: row.CreatedAt.Time,
	}
}

// WaitingDesigns is the queue, oldest first — the order they were asked in.
func (s *Store) WaitingDesigns(ctx context.Context) ([]QueuedDesign, error) {
	rows, err := s.queries.WaitingDesignRequests(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]QueuedDesign, 0, len(rows))
	for _, row := range rows {
		out = append(out, toRequest(row))
	}
	return out, nil
}

// FillDesign records a finished card and puts it on the number.
//
// Both writes in one transaction: a request marked filled whose number still
// shows the catalogue design is a buyer who was told their card was ready and
// cannot see it.
func (s *Store) FillDesign(ctx context.Context, id, imageURL string) (QueuedDesign, error) {
	requestID, err := uuid.Parse(id)
	if err != nil {
		return QueuedDesign{}, ErrNotWaiting
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return QueuedDesign{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := s.queries.WithTx(tx)

	row, err := q.FillDesignRequest(ctx, store.FillDesignRequestParams{
		ID: requestID, ImageUrl: &imageURL,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return QueuedDesign{}, ErrNotWaiting
	}
	if err != nil {
		return QueuedDesign{}, err
	}

	if _, err := q.SetCustomDesign(ctx, store.SetCustomDesignParams{
		Handle: &row.Handle, ImageUrl: &imageURL,
	}); err != nil {
		return QueuedDesign{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return QueuedDesign{}, err
	}
	return toRequest(row), nil
}

// RefuseDesign turns one down. The note is shown to the person who asked, so
// they know why rather than watching a request sit in the queue forever.
func (s *Store) RefuseDesign(ctx context.Context, id, note string) (QueuedDesign, error) {
	requestID, err := uuid.Parse(id)
	if err != nil {
		return QueuedDesign{}, ErrNotWaiting
	}

	row, err := s.queries.RefuseDesignRequest(ctx, store.RefuseDesignRequestParams{
		ID: requestID, Note: &note,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return QueuedDesign{}, ErrNotWaiting
	}
	if err != nil {
		return QueuedDesign{}, err
	}
	return toRequest(row), nil
}
