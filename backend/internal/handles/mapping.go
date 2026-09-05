package handles

import (
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// Between a database row and what the outside world is shown.

// Empty text is stored as null rather than as "", so that "not set" has one
// representation instead of two that queries have to test for separately.
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

// A price nobody paid — a gift, or an unclaimed row — reads as zero rather
// than being left out, because "0 so'm" and "no answer" are different things
// and only one of them is true here.
func derefInt(n *int64) int64 {
	if n == nil {
		return 0
	}
	return *n
}

func optionalTime(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}

// A column that cannot be read is shown as empty rather than failing the
// request: a malformed row is a bug to fix, not a reason a person cannot open
// their own profile.
func decodeLinks(raw []byte) []Link {
	links := []Link{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &links)
	}
	return links
}

func decodeServices(raw []byte) []Service {
	services := []Service{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &services)
	}
	return services
}
