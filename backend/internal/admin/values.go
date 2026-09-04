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
