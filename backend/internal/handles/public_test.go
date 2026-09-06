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

// A closed profile shows a stranger who this is and nothing that reaches them.
// The cut is a value transformation, so it is checked without a database: what
// matters is which fields survive, and that is decided here.
func TestForStrangerCutsAClosedProfileToItsFace(t *testing.T) {
	full := PublicProfile{
		Handle: "QXD483", Name: "Aziz", Avatar: "a.webp", Banner: "b.webp",
		Bio: "yurist", City: "Toshkent", Email: "a@b.uz", Phone: "+998",
		Position: "Direktor", Company: "MC", Tags: []string{"huquq"},
		Links: []Link{{Label: "Telegram", Href: "https://t.me/a"}},
		Services: []Service{{Name: "Maslahat", Price: "100 000"}},
		Design: "genesis", Plan: PlanPremium, Views: 9, Followers: 3,
		Private: true,
	}

	got := full.ForStranger(false)

	for name, v := range map[string]string{
		"bio": got.Bio, "city": got.City, "email": got.Email, "phone": got.Phone,
		"position": got.Position, "company": got.Company,
	} {
		if v != "" {
			t.Errorf("stranger can see %s = %q", name, v)
		}
	}
	if len(got.Links) != 0 || len(got.Services) != 0 || len(got.Tags) != 0 {
		t.Errorf("stranger can see links=%d services=%d tags=%d", len(got.Links), len(got.Services), len(got.Tags))
	}
	if got.Views != 0 {
		t.Errorf("stranger can see the view count %d", got.Views)
	}
	// What a locked account still shows.
	if got.Name != "Aziz" || got.Avatar != "a.webp" || got.Handle != "QXD483" || got.Followers != 3 || !got.Private {
		t.Errorf("face was cut too: %+v", got)
	}

	// The three readers who see everything.
	open := full
	open.Private = false
	if open.ForStranger(false).Bio == "" {
		t.Error("an open profile was cut")
	}
	mine := full
	mine.Mine = true
	if mine.ForStranger(false).Bio == "" {
		t.Error("the owner was cut out of their own profile")
	}
	if full.ForStranger(true).Bio == "" {
		t.Error("an accepted follower was cut")
	}

	// Somebody who asked is still a stranger, and is still told they asked.
	asked := full
	asked.Pending = true
	if cut := asked.ForStranger(false); !cut.Pending || cut.Bio != "" {
		t.Errorf("asker lost their standing or gained the profile: %+v", cut)
	}
}
