package handles

import (
	"testing"
	"time"
)

// A lapsed premium is a free profile, not a dark one. The number was paid for
// and stays reachable; it only stops carrying the premium features.
func TestEffectivePlanFallsBackWhenItLapses(t *testing.T) {
	past := time.Now().Add(-24 * time.Hour)
	future := time.Now().Add(24 * time.Hour)

	cases := []struct {
		name    string
		plan    string
		expires *time.Time
		want    string
	}{
		{"free stays free", PlanFree, nil, PlanFree},
		{"free with a date is still free", PlanFree, &future, PlanFree},
		{"premium in date", PlanPremium, &future, PlanPremium},
		{"premium out of date", PlanPremium, &past, PlanFree},
		// A gift, or a plan settled some other way. Treated as holding,
		// because the alternative silently downgrades somebody who paid.
		{"premium with no date does not lapse", PlanPremium, nil, PlanPremium},
		{"anything unrecognised is free", "enterprise", nil, PlanFree},
	}

	for _, c := range cases {
		if got := EffectivePlan(c.plan, c.expires); got != c.want {
			t.Errorf("%s: EffectivePlan(%q) = %q, want %q", c.name, c.plan, got, c.want)
		}
	}
}

func TestFirstNonEmptyNamesAProfileByItsNumberWhenBlank(t *testing.T) {
	if got := firstNonEmpty("", "QXD483"); got != "QXD483" {
		t.Errorf("got %q, want the number", got)
	}
	if got := firstNonEmpty("Aziz", "QXD483"); got != "Aziz" {
		t.Errorf("got %q, want the name", got)
	}
}
