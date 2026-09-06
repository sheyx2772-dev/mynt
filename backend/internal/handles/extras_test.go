package handles

import (
	"testing"
	"time"
)

// The week starts on the day and runs six days after it, in Tashkent, and
// wraps New Year for a December birthday greeted in January.
func TestBirthdayWindow(t *testing.T) {
	day := time.Date(1990, time.December, 30, 0, 0, 0, 0, tashkent)

	at := func(y int, m time.Month, d, h int) time.Time {
		return time.Date(y, m, d, h, 0, 0, 0, tashkent)
	}
	cases := []struct {
		name  string
		now   time.Time
		today bool
		week  bool
	}{
		{"the day before", at(2026, time.December, 29, 23), false, false},
		{"the day, first minute", at(2026, time.December, 30, 0), true, true},
		{"the day, late", at(2026, time.December, 30, 23), true, true},
		{"three days into the new year", at(2027, time.January, 3, 12), false, true},
		{"a week later", at(2027, time.January, 6, 12), false, false},
		{"midsummer", at(2026, time.July, 1, 12), false, false},
	}
	for _, c := range cases {
		got := birthdayState(&day, c.now)
		if got.Today != c.today || got.Week != c.week {
			t.Errorf("%s: today=%v week=%v, want %v %v", c.name, got.Today, got.Week, c.today, c.week)
		}
		if got.Day != "12-30" {
			t.Errorf("%s: day = %q", c.name, got.Day)
		}
	}
	if s := birthdayState(nil, time.Now()); s.Day != "" || s.Week {
		t.Errorf("no birthday is no window: %+v", s)
	}
}

// One emoji, with its modifiers; never a word.
func TestStatusEmojiIsNotAName(t *testing.T) {
	for raw, want := range map[string]string{
		"🔥": "🔥", " 👨‍👩‍👧 ": "👨‍👩‍👧", "🇺🇿": "🇺🇿",
		"CEO": "", "🔥x": "", "": "", "🔥🔥🔥🔥🔥🔥🔥🔥🔥": "",
	} {
		if got := readStatusEmoji(raw); got != want {
			t.Errorf("%q → %q, want %q", raw, got, want)
		}
	}
}

// A song is kept only from a service that plays it, and only with a title.
func TestMusicNeedsAPlayerAndATitle(t *testing.T) {
	ok := readMusic(Music{Title: "Yol", Artist: "Konsta", URL: "open.spotify.com/track/abc"})
	if ok.URL != "https://open.spotify.com/track/abc" || ok.Title != "Yol" {
		t.Fatalf("spotify: %+v", ok)
	}
	for _, bad := range []Music{
		{Title: "x", URL: "https://evil.example/track"},
		{Title: "", URL: "https://open.spotify.com/track/abc"},
		{Title: "x", URL: "javascript:alert(1)"},
	} {
		if got := readMusic(bad); got.URL != "" {
			t.Errorf("kept %+v as %+v", bad, got)
		}
	}
}
