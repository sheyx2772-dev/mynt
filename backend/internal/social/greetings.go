package social

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Tug'ilgan kun tabriklari.
//
// A greeting is an emoji and a line, left on somebody's profile in the week of
// their birthday. Anybody with an account may leave one, once a year; the
// window is decided from the date on the row, so a profile with no birthday
// takes none and a greeting on the wrong day is refused rather than stored.

// ErrNotBirthday is a greeting outside the window, or on a profile with no
// day set. One error for both, since the page only asks one question.
var ErrNotBirthday = errors.New("bugun tug'ilgan kun emas")

// Greeting is one wish, with who left it when they have a number.
type Greeting struct {
	ID     int64     `json:"id"`
	Emoji  string    `json:"emoji"`
	Text   string    `json:"matn,omitempty"`
	At     time.Time `json:"vaqt"`
	Handle string    `json:"raqam,omitempty"`
	Name   string    `json:"ism"`
	Avatar string    `json:"rasm,omitempty"`
	Mine   bool      `json:"meniki"`
}

// Greeted is what the caller needs after a greeting lands: whom to tell, and
// whether it is new — a changed emoji is not a second notification.
type Greeted struct {
	OwnerID   string
	OwnerName string
	Fresh     bool
}

// Greet leaves one. The year is the greeting's, not the birthday's: somebody
// wishing on the 3rd of January for a 30th of December is greeting last year's
// day, and the row says so.
func (s *Store) Greet(ctx context.Context, handle, userID, emoji, text string) (Greeted, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return Greeted{}, err
	}

	target, err := s.queries.GreetingTarget(ctx, optional(handle))
	if errors.Is(err, pgx.ErrNoRows) {
		return Greeted{}, ErrNotBirthday
	}
	if err != nil {
		return Greeted{}, err
	}
	var day *time.Time
	if target.TugilganKun.Valid {
		d := target.TugilganKun.Time
		day = &d
	}
	now := time.Now()
	if !handles.GreetingOpen(day, now) {
		return Greeted{}, ErrNotBirthday
	}

	row, err := s.queries.Greet(ctx, store.GreetParams{
		Handle: handle, UserID: id, Emoji: emoji, Matn: text, Yil: greetingYear(day, now),
	})
	if err != nil {
		return Greeted{}, err
	}

	owner := ""
	if target.UserID != nil {
		owner = target.UserID.String()
	}
	return Greeted{OwnerID: owner, OwnerName: deref(target.OwnerName), Fresh: row.Fresh}, nil
}

// Greetings lists this year's, newest first.
func (s *Store) Greetings(ctx context.Context, handle, viewerID string, limit int32) ([]Greeting, int64, error) {
	target, err := s.queries.GreetingTarget(ctx, optional(handle))
	if err != nil {
		return []Greeting{}, 0, nil
	}
	var day *time.Time
	if target.TugilganKun.Valid {
		d := target.TugilganKun.Time
		day = &d
	}
	year := greetingYear(day, time.Now())

	rows, err := s.queries.Greetings(ctx, store.GreetingsParams{Handle: handle, Yil: year, PageSize: limit})
	if err != nil {
		return nil, 0, err
	}
	count, err := s.queries.CountGreetings(ctx, store.CountGreetingsParams{Handle: handle, Yil: year})
	if err != nil {
		return nil, 0, err
	}

	out := make([]Greeting, 0, len(rows))
	for _, r := range rows {
		out = append(out, Greeting{
			ID: r.ID, Emoji: r.Emoji, Text: r.Matn, At: r.CreatedAt.Time,
			Handle: deref(r.SenderHandle), Name: firstNonEmpty(deref(r.SenderName), "Mehmon"),
			Avatar: deref(r.SenderAvatar), Mine: viewerID != "" && r.UserID.String() == viewerID,
		})
	}
	return out, count, nil
}

// greetingYear is the year of the birthday being greeted — this year's unless
// the day was in the last days of December and today is early January.
func greetingYear(day *time.Time, now time.Time) int32 {
	year := now.Year()
	if day != nil && now.Month() == time.January && day.Month() == time.December {
		year--
	}
	return int32(year)
}
