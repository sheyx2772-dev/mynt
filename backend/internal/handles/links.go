package handles

import (
	"net/url"
	"regexp"
	"strings"
)

// A link on a profile is rebuilt from validated parts, never passed through.
//
// These are rendered as clickable anchors on a page anybody can open, which
// makes the whole set of them attacker-controlled input with an audience. So a
// username is checked against what the platform actually allows and then put
// into a URL we build, rather than a URL being accepted and hoped about.

type Link struct {
	Label string `json:"label"`
	Href  string `json:"href"`
	// What kind of thing it is, when that changes how it is drawn. Empty for
	// an ordinary link; "payment" for the one that ends in money, which the
	// profile shows as a button rather than as another row in a list.
	//
	// Absent from every link written before this field existed, which is why
	// it is omitempty and why nothing reads it as required.
	Kind string `json:"kind,omitempty"`
}

// The characters the platforms allow. The hyphen is in the set because
// LinkedIn's public profile slugs are built from it — without it, every
// LinkedIn address a person would actually paste is rejected.
//
// The second pattern is the one that took a test to find. The first accepts
// ".." — a dot is a legal character in a username — and ".." appended to a
// base address is a path segment meaning "up one", so "instagram.com/" plus
// ".." is a link to instagram.com. Requiring at least one letter or digit
// refuses that, and "." and "---" with it, while accepting every username a
// person actually has.
var (
	usernamePattern = regexp.MustCompile(`^[A-Za-z0-9._-]{1,64}$`)
	hasAlphanumeric = regexp.MustCompile(`[A-Za-z0-9]`)
)

func socialLink(label, raw, base string) (Link, bool) {
	value := strings.TrimPrefix(strings.TrimSpace(raw), "@")
	if value == "" || !usernamePattern.MatchString(value) || !hasAlphanumeric.MatchString(value) {
		return Link{}, false
	}
	return Link{Label: label, Href: base + value}, true
}

// WebsiteLink is the one field that takes a whole address, and therefore the
// one that has to be examined rather than assembled.
func WebsiteLink(raw string) (Link, bool) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return Link{}, false
	}

	// A person types "example.uz". Prepending the scheme is what makes that a
	// URL — and is also how a bare "mailto:a@b.com" would survive, which is
	// why the checks below still run afterwards.
	if !strings.HasPrefix(strings.ToLower(value), "http://") &&
		!strings.HasPrefix(strings.ToLower(value), "https://") {
		value = "https://" + value
	}

	parsed, err := url.Parse(value)
	if err != nil {
		return Link{}, false
	}

	// Anything but http(s) — javascript:, data:, file: — is refused rather than
	// rendered as something to click on a public page.
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return Link{}, false
	}

	// Credentials in the authority let a link read as one host while pointing at
	// another: "https://flex-nfc.uz@evil.com" is a request to evil.com.
	if parsed.User != nil {
		return Link{}, false
	}

	// A host with no dot is not a public site; it is "localhost", or a name that
	// resolves inside somebody's network.
	if !strings.Contains(parsed.Hostname(), ".") {
		return Link{}, false
	}

	return Link{Label: "Veb-sayt", Href: parsed.String()}, true
}

// WhatsApp is built from a number rather than a name. wa.me wants no plus and
// no spaces; given either it shows a page saying the number is invalid.
func whatsappLink(raw string) (Link, bool) {
	var digits strings.Builder
	for _, c := range raw {
		if c >= '0' && c <= '9' {
			digits.WriteRune(c)
		}
	}
	number := digits.String()
	if len(number) < 7 || len(number) > 15 {
		return Link{}, false
	}
	return Link{Label: "WhatsApp", Href: "https://wa.me/" + number}, true
}

// LinkInput is what a profile form sends: names and addresses, not links.
type LinkInput struct {
	Booking   string `json:"booking,omitempty"`
	Telegram  string `json:"telegram,omitempty"`
	WhatsApp  string `json:"whatsapp,omitempty"`
	Instagram string `json:"instagram,omitempty"`
	LinkedIn  string `json:"linkedin,omitempty"`
	Facebook  string `json:"facebook,omitempty"`
	YouTube   string `json:"youtube,omitempty"`
	Website   string `json:"website,omitempty"`
	// Where somebody pays this profile's owner. See paymentLink.
	Payment string `json:"payment,omitempty"`
}

// BuildLinks returns the ordered list a profile shows, dropping anything that
// did not survive validation.
//
// The order is the order they are read in: the ways to talk to a person first,
// then the places to look them up, then their own site. Booking leads because
// it is the one that ends in an appointment.
func BuildLinks(in LinkInput) []Link {
	links := make([]Link, 0, 9)

	// First, because it is the only one that ends in the owner being paid.
	if link, ok := paymentLink(in.Payment); ok {
		links = append(links, link)
	}
	if link, ok := WebsiteLink(in.Booking); ok {
		// Whatever the owner uses — Calendly, a Telegram bot — so it is a plain
		// address under a name that says what it does.
		links = append(links, Link{Label: "Uchrashuv", Href: link.Href})
	}
	if link, ok := socialLink("Telegram", in.Telegram, "https://t.me/"); ok {
		links = append(links, link)
	}
	if link, ok := whatsappLink(in.WhatsApp); ok {
		links = append(links, link)
	}
	if link, ok := socialLink("Instagram", in.Instagram, "https://instagram.com/"); ok {
		links = append(links, link)
	}
	if link, ok := socialLink("LinkedIn", in.LinkedIn, "https://linkedin.com/in/"); ok {
		links = append(links, link)
	}
	if link, ok := socialLink("Facebook", in.Facebook, "https://facebook.com/"); ok {
		links = append(links, link)
	}
	if link, ok := socialLink("YouTube", in.YouTube, "https://youtube.com/@"); ok {
		links = append(links, link)
	}
	if link, ok := WebsiteLink(in.Website); ok {
		links = append(links, link)
	}

	return links
}

// The hosts a payment link may point at.
//
// An allowlist rather than a check that it is a URL, and this is the whole
// security argument for the feature: the profile renders this as "pay here" on
// a page anybody can open, so an address the owner chooses freely is a
// phishing page we would be hosting under somebody else's name and our domain.
// Restricting it to the two providers that actually operate here means the
// worst a hostile owner can do is take their own money.
//
// It also cannot be a merchant checkout of ours — those are built from an
// order id on the server. This is the owner's personal transfer link, the kind
// Payme and Click give an individual who has no merchant account, which is
// what almost every barber, tutor and driver has.
var paymentHosts = map[string]bool{
	"payme.uz": true, "www.payme.uz": true, "p.payme.uz": true,
	"click.uz": true, "www.click.uz": true, "my.click.uz": true, "m.click.uz": true,
}

// paymentLink accepts an address at one of those hosts and nothing else.
func paymentLink(raw string) (Link, bool) {
	link, ok := WebsiteLink(raw)
	if !ok {
		return Link{}, false
	}

	parsed, err := url.Parse(link.Href)
	if err != nil || !paymentHosts[strings.ToLower(parsed.Hostname())] {
		return Link{}, false
	}

	return Link{Label: "To'lash", Href: link.Href, Kind: "payment"}, true
}
