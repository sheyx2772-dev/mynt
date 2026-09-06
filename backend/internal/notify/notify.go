// Package notify records that something happened to somebody, and pushes it.
//
// The order is the whole design: the row is written first and the channels run
// afterwards. A notice recorded but not delivered is one the owner still finds
// in their cabinet; one delivered but not recorded is gone the moment the
// message scrolls away. So a channel failing is not an error anybody hears
// about — the event survived.
//
// Nothing here may hold up what caused it. Somebody leaving their contact on a
// profile should see the confirmation immediately; whether the owner's Telegram
// answered in time is not their problem.
package notify

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Kind is what happened. Each one is a sentence somebody reads on a phone.
type Kind string

const (
	KindLead         Kind = "lead"
	KindPlanExpiring Kind = "plan_expiring"
	KindPlanExpired  Kind = "plan_expired"
	KindTransfer     Kind = "transfer"
	KindVenueRequest Kind = "venue_request"
	KindDeviceOrder  Kind = "device_order"
	KindTagMessage   Kind = "tag_message"
	KindGreeting     Kind = "greeting"
	KindGift         Kind = "gift"
)

// Notice is one thing worth telling somebody.
type Notice struct {
	UserID string
	Kind   Kind
	// The number it concerns, when it concerns one.
	Handle string
	Title  string
	Body   string
	// Where it points inside the site. Always a path, never an address — a
	// notice that can carry a full URL is a notice that can carry someone
	// else's.
	Href string
}

// Channel is somewhere a notice can be delivered.
//
// `Send` returns whether it went and must not return an error: a channel that
// is down has to leave the recorded notice alone rather than taking the event
// with it.
type Channel interface {
	Name() string
	Send(ctx context.Context, notice Notice, chatID int64) bool
}

type Service struct {
	queries  *store.Queries
	channels []Channel
}

func New(queries *store.Queries, channels ...Channel) *Service {
	return &Service{queries: queries, channels: channels}
}

// Send records a notice and pushes it where the owner has asked.
func (s *Service) Send(ctx context.Context, notice Notice) {
	owner, err := uuid.Parse(notice.UserID)
	if err != nil {
		return
	}

	// Recorded first, and on its own: if this fails there is nothing to
	// deliver, and if delivery fails the record still stands.
	if _, err := s.queries.RecordNotice(ctx, store.RecordNoticeParams{
		UserID: owner,
		Kind:   string(notice.Kind),
		Handle: optional(notice.Handle),
		Title:  notice.Title,
		Body:   optional(notice.Body),
		Href:   optional(notice.Href),
	}); err != nil {
		slog.Error("xabar yozilmadi", "xato", err, "tur", notice.Kind)
		return
	}

	settings, err := s.queries.NotifySettings(ctx, owner)
	if err != nil {
		// No row is the normal state for somebody who has never linked
		// anything. They still have the notice; there is nowhere to push it.
		return
	}
	if settings.TelegramChatID == nil {
		return
	}

	// A table waiting for a waiter is the same kind of event as a lead —
	// somebody is in front of the product right now — so it follows the same
	// switch rather than the one about invoices.
	live := notice.Kind == KindLead || notice.Kind == KindVenueRequest || notice.Kind == KindGreeting || notice.Kind == KindGift
	wanted := settings.PlanAlerts
	if live {
		wanted = settings.LeadAlerts
	}
	if !wanted {
		return
	}

	for _, channel := range s.channels {
		if !channel.Send(ctx, notice, *settings.TelegramChatID) {
			slog.Warn("xabar yetkazilmadi", "kanal", channel.Name(), "tur", notice.Kind)
		}
	}
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

func optionalTime(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}
