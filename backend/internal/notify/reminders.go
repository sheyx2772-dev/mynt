package notify

import (
	"context"
	"fmt"
	"log/slog"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Reminding people before it runs out.
//
// Two subjects with one shape. A personal plan losing its gold and its
// statistics, and a venue losing the call button on every table, are the same
// event to this code and different events to the person reading them — so the
// words differ and the mechanism does not.
//
// A venue gets two notices rather than one. Seven days out is a warning
// somebody can act on; the day it lapses is a fact, the buttons are already
// gone, and it is the one that gets a venue back.

// Far enough ahead to act on, close enough to be about this month.
const RemindDaysBefore = 7

// How long after a lapse it is still news worth sending.
const AnnounceLapseWithinDays = 3

// Run is what one pass did, for the log and for the scheduler's reply.
type Run struct {
	Checked int `json:"korildi"`
	Sent    int `json:"yuborildi"`
}

func daysUntil(at time.Time, now time.Time) int {
	return int(math.Max(0, math.Ceil(at.Sub(now).Hours()/24)))
}

// Remind sends every reminder that is due, personal and venue alike.
func (s *Service) Remind(ctx context.Context, now time.Time) Run {
	run := s.remindHandles(ctx, now)

	venues := s.remindVenues(ctx, now)
	run.Checked += venues.Checked
	run.Sent += venues.Sent

	return run
}

func (s *Service) remindHandles(ctx context.Context, now time.Time) Run {
	rows, err := s.queries.HandlesNeedingPlanReminder(ctx, RemindDaysBefore)
	if err != nil {
		slog.Error("eslatma ro'yxati o'qilmadi", "xato", err)
		return Run{}
	}

	run := Run{Checked: len(rows)}
	for _, row := range rows {
		if row.UserID == nil || row.Normalized == nil {
			continue
		}
		left := daysUntil(row.PlanExpiresAt.Time, now)

		s.Send(ctx, Notice{
			UserID: row.UserID.String(),
			Kind:   KindPlanExpiring,
			Handle: *row.Normalized,
			Title:  fmt.Sprintf("%s — premium %d kundan keyin tugaydi", *row.Normalized, left),
			// What actually stops, in the words of what they will miss, rather
			// than "your subscription is ending". Somebody who cannot picture
			// the loss does not renew.
			Body: "Statistika, kelgan kontaktlar va oltin bezak to'xtaydi. " +
				"Raqamingiz va profilingiz ochiq qoladi.",
			Href: "/tarif",
		})

		// Marked only after the notice exists, so a run that dies halfway
		// leaves the reminder outstanding rather than swallowed.
		if err := s.queries.MarkPlanReminded(ctx, store.MarkPlanRemindedParams{
			Handle: row.Normalized, ExpiresAt: row.PlanExpiresAt,
		}); err != nil {
			slog.Error("eslatma belgilanmadi", "xato", err, "raqam", *row.Normalized)
			continue
		}
		run.Sent++
	}
	return run
}

func (s *Service) remindVenues(ctx context.Context, now time.Time) Run {
	run := Run{}

	expiring, err := s.queries.VenuesNeedingPlanReminder(ctx, RemindDaysBefore)
	if err != nil {
		slog.Error("muassasa eslatmalari o'qilmadi", "xato", err)
	}
	for _, row := range expiring {
		if row.UserID == nil || row.Normalized == nil {
			continue
		}
		run.Checked++
		left := daysUntil(row.PlanExpiresAt.Time, now)

		s.Send(ctx, Notice{
			UserID: row.UserID.String(),
			Kind:   KindPlanExpiring,
			Handle: *row.Normalized,
			Title:  fmt.Sprintf("%s — obuna %d kundan keyin tugaydi", row.Name, left),
			// Named as the thing they will miss, not as an administrative
			// state.
			Body: "Stollardagi chaqiruv tugmasi va hisobot to'xtaydi. " +
				"Menyu mehmonlarga ochiq qoladi.",
			Href: fmt.Sprintf("/kabinet/%s/obuna", *row.Normalized),
		})

		if err := s.markVenue(ctx, row.ID, row.PlanExpiresAt, false); err != nil {
			slog.Error("muassasa eslatmasi belgilanmadi", "xato", err)
			continue
		}
		run.Sent++
	}

	lapsed, err := s.queries.VenuesJustExpired(ctx, AnnounceLapseWithinDays)
	if err != nil {
		slog.Error("tugagan obunalar o'qilmadi", "xato", err)
	}
	for _, row := range lapsed {
		if row.UserID == nil || row.Normalized == nil {
			continue
		}
		run.Checked++

		s.Send(ctx, Notice{
			UserID: row.UserID.String(),
			Kind:   KindPlanExpired,
			Handle: *row.Normalized,
			Title:  fmt.Sprintf("%s — obuna tugadi", row.Name),
			// Present tense and specific, because it has already happened and
			// the owner needs to know exactly what a guest now sees.
			Body: "Chaqiruv tugmasi stollardan olib tashlandi va hisobot yopildi. " +
				"Menyu ishlayapti — to'lovdan keyin hammasi joyiga qaytadi.",
			Href: fmt.Sprintf("/kabinet/%s/obuna", *row.Normalized),
		})

		if err := s.markVenue(ctx, row.ID, row.PlanExpiresAt, true); err != nil {
			slog.Error("tugash xabari belgilanmadi", "xato", err)
			continue
		}
		run.Sent++
	}

	return run
}

func (s *Service) markVenue(ctx context.Context, id uuid.UUID, at pgtype.Timestamptz, expired bool) error {
	if expired {
		return s.queries.MarkVenueExpiredTold(ctx, store.MarkVenueExpiredToldParams{ID: id, ExpiresAt: at})
	}
	return s.queries.MarkVenueReminded(ctx, store.MarkVenueRemindedParams{ID: id, ExpiresAt: at})
}
