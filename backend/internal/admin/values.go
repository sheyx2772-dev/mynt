package admin

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// Empty means "no filter" rather than "match the empty string", and a null
// column reads as empty text rather than crashing a page.

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

// A form sends zero for "no limit"; the column wants null. Kept together so the
// two spellings of "nothing" meet in one place.
func positive(v int64) *int64 {
	if v <= 0 {
		return nil
	}
	return &v
}

func positive32(v int32) *int32 {
	if v <= 0 {
		return nil
	}
	return &v
}

// Whole days, which is what a campaign is measured in.
func parseDay(raw string) (*time.Time, error) {
	if raw == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.DateOnly, raw)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func stamp(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}
