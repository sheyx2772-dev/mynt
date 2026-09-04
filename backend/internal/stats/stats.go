// Package stats answers what a number did, for the person who owns it.
//
// Nothing that identifies a visitor is stored or returned. A visit is recorded
// as a salted hash of the day, the address and the user agent: enough to tell
// repeat visits apart within a day, worthless the next morning because the day
// is part of the hash. So there is no way to ask this package who visited, and
// that is a property of the data rather than of the API in front of it.
package stats

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// The window a caller may ask for. Bounded by what a chart can draw and by what
// one query should scan; a caller asking for ten years would otherwise get a
// sequential scan of the whole table.
const (
	MinDays     = 1
	MaxDays     = 90
	DefaultDays = 30
)

// Days clamps whatever the caller asked for into something answerable.
func Days(asked int) int {
	switch {
	case asked < MinDays:
		return DefaultDays
	case asked > MaxDays:
		return MaxDays
	default:
		return asked
	}
}

type Day struct {
	Day      string `json:"kun" example:"2026-09-04"`
	Views    int64  `json:"korishlar"`
	Clicks   int64  `json:"bosishlar"`
	Visitors int64  `json:"tashrifchilar"`
}

type LinkStat struct {
	Label  string `json:"havola"`
	Clicks int64  `json:"bosishlar"`
}

// SourceStat says whether the card is what is bringing people. "togridan" is
// everything we did not issue a link for — somebody typing the address, or a
// browser that sent no referrer.
type SourceStat struct {
	Source string `json:"manba" example:"nfc"`
	Views  int64  `json:"korishlar"`
}

type Report struct {
	Daily   []Day        `json:"kunlar"`
	Links   []LinkStat   `json:"havolalar"`
	Sources []SourceStat `json:"manbalar"`

	TotalViews  int64 `json:"jami_korishlar"`
	TotalClicks int64 `json:"jami_bosishlar"`
	// Unique per day, so the total is an upper bound on distinct people rather
	// than a distinct count across the window. Named so nobody reads it as the
	// latter.
	TotalVisitors int64 `json:"jami_tashrifchilar_kunlik"`
}

type Store struct {
	queries *store.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{queries: store.New(pool)}
}

// For builds the report. The caller must already have established that whoever
// is asking owns this number — this package does not check, and says so.
func (s *Store) For(ctx context.Context, normalized string, days int) (Report, error) {
	days = Days(days)
	report := Report{Daily: []Day{}, Links: []LinkStat{}, Sources: []SourceStat{}}

	daily, err := s.queries.HandleStats(ctx, store.HandleStatsParams{Handle: normalized, Days: int32(days)})
	if err != nil {
		return Report{}, err
	}
	for _, row := range daily {
		report.Daily = append(report.Daily, Day{
			Day:      row.Day.Time.Format(time.DateOnly),
			Views:    row.Views,
			Clicks:   row.Clicks,
			Visitors: row.Visitors,
		})
		report.TotalViews += row.Views
		report.TotalClicks += row.Clicks
		report.TotalVisitors += row.Visitors
	}

	links, err := s.queries.HandleLinkStats(ctx, store.HandleLinkStatsParams{Handle: normalized, Days: int32(days)})
	if err != nil {
		return Report{}, err
	}
	for _, row := range links {
		report.Links = append(report.Links, LinkStat{Label: row.Label, Clicks: row.Clicks})
	}

	sources, err := s.queries.HandleSourceStats(ctx, store.HandleSourceStatsParams{Handle: normalized, Days: int32(days)})
	if err != nil {
		return Report{}, err
	}
	for _, row := range sources {
		report.Sources = append(report.Sources, SourceStat{Source: row.Source, Views: row.Views})
	}

	return report, nil
}
