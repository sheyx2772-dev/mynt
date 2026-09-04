package handles

import "testing"

// A profile link is attacker-controlled input rendered as something to click on
// a page anybody can open. These are the cases that make that safe.
func TestWebsiteLinkRefusesWhatIsNotAWebsite(t *testing.T) {
	dangerous := []struct {
		input string
		why   string
	}{
		{"javascript:alert(1)", "a scheme that runs code in the visitor's page"},
		{"JavaScript:alert(1)", "the same, spelled to slip a lowercase comparison"},
		{"data:text/html,<script>alert(1)</script>", "a page carried inside the link"},
		{"file:///etc/passwd", "a path on the visitor's own machine"},
		{"mailto:aziz@example.com", "not a website, and would survive a naive https:// prefix"},
		{"https://flex.com.uz@evil.com", "reads as flex.com.uz, requests evil.com"},
		{"https://user:pass@evil.com", "the same trick with a password in it"},
		{"http://localhost:3000", "a host inside the visitor's network"},
		{"https://intranet", "a name with no dot resolves somewhere private"},
		{"", "nothing at all"},
		{"   ", "whitespace"},
	}

	for _, c := range dangerous {
		if link, ok := WebsiteLink(c.input); ok {
			t.Errorf("%q qabul qilindi (%s) → %s", c.input, c.why, link.Href)
		}
	}
}

func TestWebsiteLinkAcceptsWhatSomebodyWouldActuallyType(t *testing.T) {
	cases := map[string]string{
		"flex.com.uz":          "https://flex.com.uz",
		"https://flex.com.uz":  "https://flex.com.uz",
		"http://flex.com.uz":   "http://flex.com.uz",
		"  flex.com.uz/aziz  ": "https://flex.com.uz/aziz",
	}

	for input, want := range cases {
		link, ok := WebsiteLink(input)
		if !ok {
			t.Errorf("%q rad etildi", input)
			continue
		}
		if link.Href != want {
			t.Errorf("%q → %q, kutilgani %q", input, link.Href, want)
		}
	}
}

func TestUsernamesAreBuiltIntoAddressesRatherThanAccepted(t *testing.T) {
	links := BuildLinks(LinkInput{
		Telegram:  "@azizkarimov",
		Instagram: "azizkarimov",
		WhatsApp:  "+998 90 123 45 67",
	})

	want := []Link{
		{Label: "Telegram", Href: "https://t.me/azizkarimov"},
		{Label: "WhatsApp", Href: "https://wa.me/998901234567"},
		{Label: "Instagram", Href: "https://instagram.com/azizkarimov"},
	}

	if len(links) != len(want) {
		t.Fatalf("%d ta havola, kutilgani %d: %+v", len(links), len(want), links)
	}
	for i, w := range want {
		if links[i] != w {
			t.Errorf("%d: %+v, kutilgani %+v", i, links[i], w)
		}
	}
}

func TestAUsernameCannotEscapeIntoThePath(t *testing.T) {
	// A username is appended to a base address, so anything that could end the
	// path or start a new host has to be refused before it gets there.
	for _, bad := range []string{
		"aziz/../../evil", "aziz?x=1", "aziz#frag", "aziz karimov",
		"evil.com/x", "..", "/", "@@", "aziz\\evil",
	} {
		links := BuildLinks(LinkInput{Telegram: bad})
		if len(links) != 0 {
			t.Errorf("%q qabul qilindi → %s", bad, links[0].Href)
		}
	}
}

func TestEmptyFieldsProduceNoLinks(t *testing.T) {
	if links := BuildLinks(LinkInput{}); len(links) != 0 {
		t.Errorf("bo'sh formadan %d ta havola chiqdi", len(links))
	}
}

func TestLinksComeBackInTheOrderTheyAreRead(t *testing.T) {
	links := BuildLinks(LinkInput{
		Website:   "flex.com.uz",
		Instagram: "aziz",
		Booking:   "calendly.com/aziz",
		Telegram:  "aziz",
	})

	// Booking first because it is the one that ends in an appointment; the
	// person's own site last because it is the least direct way to reach them.
	want := []string{"Uchrashuv", "Telegram", "Instagram", "Veb-sayt"}
	if len(links) != len(want) {
		t.Fatalf("%d ta havola: %+v", len(links), links)
	}
	for i, label := range want {
		if links[i].Label != label {
			t.Errorf("%d: %q, kutilgani %q", i, links[i].Label, label)
		}
	}
}
