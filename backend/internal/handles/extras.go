package handles

import (
	"encoding/json"
	"net/url"
	"strings"
	"time"
	"unicode"
)

// The three things a profile carries that make it a person's page: a birthday,
// a song, and an emoji beside the name. Each is validated here, and the last
// two are premium — see ReadProfile — so a free profile that sends them saves
// nothing rather than being told off, since the form never offers them.

// Music is one song the owner chose, as a link to where it plays.
type Music struct {
	Title  string `json:"sarlavha" maxLength:"80"`
	Artist string `json:"ijrochi,omitempty" maxLength:"80"`
	URL    string `json:"url" maxLength:"500"`
}

// Where a song may point. An allowlist because the page embeds the player:
// an address the owner chooses freely is an iframe of anything, on a page
// under our domain. Every host here is a music service with an embed of its
// own, and the site decides which of them it knows how to draw.
var musicHosts = map[string]bool{
	"open.spotify.com": true, "spotify.link": true,
	"music.yandex.ru": true, "music.yandex.uz": true, "music.yandex.com": true,
	"music.youtube.com": true, "www.youtube.com": true, "youtube.com": true, "youtu.be": true,
	"soundcloud.com": true, "on.soundcloud.com": true, "m.soundcloud.com": true,
	"music.apple.com": true,
}

// readMusic keeps a song only when it points somewhere that plays it.
func readMusic(in Music) Music {
	link, ok := WebsiteLink(in.URL)
	if !ok {
		return Music{}
	}
	parsed, err := url.Parse(link.Href)
	if err != nil || !musicHosts[strings.ToLower(parsed.Hostname())] {
		return Music{}
	}
	title := trim(in.Title, 80)
	if title == "" {
		return Music{}
	}
	return Music{Title: title, Artist: trim(in.Artist, 80), URL: link.Href}
}

func decodeMusic(raw []byte) Music {
	var m Music
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &m)
	}
	return m
}

// readStatusEmoji accepts a short run of non-ASCII — one emoji, possibly a
// joined sequence with its modifiers — and nothing that reads as text. Eight
// runes is a family emoji with skin tones; a word is refused by the letter
// check, which is the point: the column beside a name is not a second name.
func readStatusEmoji(raw string) string {
	value := strings.TrimSpace(raw)
	runes := []rune(value)
	if len(runes) == 0 || len(runes) > 8 {
		return ""
	}
	for _, r := range runes {
		if r < 0x80 || unicode.IsLetter(r) || unicode.IsDigit(r) {
			return ""
		}
	}
	return value
}

// The owner's calendar. Birthdays turn in Tashkent, where the owners are; a
// server in another zone would otherwise wish somebody happy birthday at the
// wrong hour, or on the wrong day.
var tashkent = mustZone("Asia/Tashkent")

func mustZone(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		return time.FixedZone("UZT", 5*3600)
	}
	return loc
}

// readBirthday parses a date a person typed and refuses one nobody has.
func readBirthday(raw string) *time.Time {
	value := strings.TrimSpace(raw)
	if value == "" {
		return nil
	}
	day, err := time.ParseInLocation("2006-01-02", value, tashkent)
	if err != nil {
		return nil
	}
	age := time.Now().In(tashkent).Year() - day.Year()
	if age < 5 || age > 120 {
		return nil
	}
	return &day
}

// BirthdayState is what a profile says about the day, without the year: a
// visitor is told the date, not the age.
type BirthdayState struct {
	// "MM-DD", empty when the owner has not set one.
	Day string `json:"kun,omitempty"`
	// Today, in the owner's zone.
	Today bool `json:"bugun"`
	// Today or the six days after: the window in which a greeting is taken.
	Week bool `json:"hafta"`
}

// How long after the day a greeting still lands. A week, because that is how
// long the people who missed it keep saying so.
const greetingWindow = 7

// birthdayState works out where today falls relative to the day.
func birthdayState(day *time.Time, now time.Time) BirthdayState {
	if day == nil {
		return BirthdayState{}
	}
	now = now.In(tashkent)
	state := BirthdayState{Day: day.Format("01-02")}
	// Whole days, midnight to midnight: the evening before is not the day,
	// however close, and a fraction of a day rounded toward zero said it was.
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, tashkent)

	// This year's occurrence, and last year's for the first days of January
	// when the window straddles New Year.
	for _, year := range []int{now.Year(), now.Year() - 1} {
		this := time.Date(year, day.Month(), day.Day(), 0, 0, 0, 0, tashkent)
		since := int(today.Sub(this).Hours() / 24)
		if since >= 0 && since < greetingWindow {
			state.Week = true
			state.Today = since == 0
		}
	}
	return state
}

// GreetingOpen reports whether a greeting for this day lands today.
func GreetingOpen(day *time.Time, now time.Time) bool {
	return birthdayState(day, now).Week
}
