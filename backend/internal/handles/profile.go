package handles

import (
	"regexp"
	"strings"
	"unicode"
)

// What a plan buys.
//
// The column says what was bought; the date says whether it still holds, and a
// lapsed premium falls back to free rather than going dark — the number was
// paid for and stays reachable. This is the only place the two are read
// together, so nothing downstream has to remember the rule.
const (
	PlanFree    = "free"
	PlanPremium = "premium"
)

// Services a profile may list, by plan. Five on free rather than three: a
// services list is the reason a tradesman or a lawyer keeps the card at all,
// and the premium difference has to come from what the free plan can afford to
// lack — the statistics, the contacts collected — not from cutting the feature
// that sells the product.
var serviceLimits = map[string]int{PlanFree: 5, PlanPremium: 8}

func ServiceLimit(plan string) int {
	if limit, ok := serviceLimits[plan]; ok {
		return limit
	}
	return serviceLimits[PlanFree]
}

// The six designs the site can draw. A stored value the renderer does not know
// would be a blank card, so anything else falls back rather than being kept.
var cardDesigns = map[string]bool{
	"genesis": true, "xarita": true, "naqsh": true,
	"humo": true, "paxta": true, "tun": true,
}

const (
	DefaultCardDesign = "genesis"
	DefaultDeviceType = "card"
)

func CardDesign(raw string) string {
	if cardDesigns[raw] {
		return raw
	}
	return DefaultCardDesign
}

var deviceTypes = map[string]bool{"card": true, "ring": true, "bracelet": true}

func DeviceType(raw string) string {
	if deviceTypes[raw] {
		return raw
	}
	return DefaultDeviceType
}

// A service is a line on a price list: what it is, and what it costs.
type Service struct {
	Name  string `json:"name"`
	Price string `json:"price"`
}

const maxTags = 5

var (
	emailPattern = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
	phonePattern = regexp.MustCompile(`^[0-9+()\- ]{7,30}$`)
)

// Profile is an edit that has been checked. Nothing constructs one except
// ReadProfile, so a handler holding one knows every field is already within
// what the database will accept.
type Profile struct {
	Name         string
	Bio          string
	Links        []Link
	Services     []Service
	City         string
	ContactEmail string
	Phone        string
	Position     string
	Company      string
	Tags         []string
	CardDesign   string
	DeviceType   string
}

// ProfileInput is what arrives from a form or an app.
//
// Only the name is required. Huma treats a field as required unless its JSON
// tag says otherwise, and a profile is edited a field at a time — an app that
// only knows about the fields it shows must not be forced to send back the ones
// it does not.
type ProfileInput struct {
	Name         string    `json:"name" maxLength:"80" doc:"Yagona majburiy maydon"`
	Bio          string    `json:"bio,omitempty" maxLength:"280"`
	Links        LinkInput `json:"links,omitempty"`
	Services     []Service `json:"services,omitempty"`
	City         string    `json:"city,omitempty" maxLength:"60"`
	ContactEmail string    `json:"contactEmail,omitempty" maxLength:"120"`
	Phone        string    `json:"phone,omitempty" maxLength:"30"`
	Position     string    `json:"position,omitempty" maxLength:"80"`
	Company      string    `json:"company,omitempty" maxLength:"80"`
	Tags         string    `json:"tags,omitempty" maxLength:"200" doc:"Vergul yoki bo'sh joy bilan ajratilgan"`
	CardDesign   string    `json:"cardDesign,omitempty"`
	DeviceType   string    `json:"deviceType,omitempty"`
}

// ReadProfile turns an edit into something storable, or says what is wrong.
//
// `plan` comes from the row being edited, never from the request: a client that
// sends "premium" is describing itself, not granting itself anything.
func ReadProfile(in ProfileInput, plan string) (Profile, string) {
	name := trim(in.Name, 80)
	if name == "" {
		return Profile{}, "Ism kiritish shart."
	}

	// An address that is not one is dropped rather than rendered, because it is
	// shown publicly and turned into a mailto: link. Same for the phone, which
	// a card is tapped to dial.
	email := trim(strings.ToLower(in.ContactEmail), 120)
	if email != "" && !emailPattern.MatchString(email) {
		email = ""
	}
	phone := trim(in.Phone, 30)
	if phone != "" && !phonePattern.MatchString(phone) {
		phone = ""
	}

	return Profile{
		Name:         name,
		Bio:          trim(in.Bio, 280),
		Links:        BuildLinks(in.Links),
		Services:     readServices(in.Services, ServiceLimit(plan)),
		City:         trim(in.City, 60),
		ContactEmail: email,
		Phone:        phone,
		Position:     trim(in.Position, 80),
		Company:      trim(in.Company, 80),
		Tags:         ParseTags(in.Tags),
		CardDesign:   CardDesign(in.CardDesign),
		DeviceType:   DeviceType(in.DeviceType),
	}, ""
}

// ParseTags reduces what somebody typed to letters and digits.
//
// Tags are rendered as "#tag" and used in search, so anything that would need
// escaping in either place is removed rather than stored and worked around.
func ParseTags(raw string) []string {
	seen := make(map[string]bool, maxTags)
	tags := make([]string, 0, maxTags)

	for _, piece := range strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || unicode.IsSpace(r)
	}) {
		var clean strings.Builder
		for _, r := range strings.TrimPrefix(piece, "#") {
			if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' {
				clean.WriteRune(r)
			}
			if clean.Len() >= 20 {
				break
			}
		}

		tag := clean.String()
		if tag == "" || seen[tag] {
			continue
		}
		seen[tag] = true
		tags = append(tags, tag)

		if len(tags) >= maxTags {
			break
		}
	}

	return tags
}

// readServices keeps as many priced lines as the plan allows, dropping the
// blank rows a form sends for the slots nobody filled in.
func readServices(in []Service, limit int) []Service {
	out := make([]Service, 0, limit)

	for _, s := range in {
		name := trim(s.Name, 60)
		if name == "" {
			continue
		}
		out = append(out, Service{Name: name, Price: trim(s.Price, 40)})
		if len(out) >= limit {
			break
		}
	}

	return out
}

// trim cuts by rune rather than by byte. Uzbek is written with multi-byte
// characters, and a byte-wise cut lands in the middle of one — which stores
// invalid UTF-8 and renders as a replacement character.
func trim(s string, limit int) string {
	s = strings.TrimSpace(s)
	runes := []rune(s)
	if len(runes) <= limit {
		return s
	}
	return strings.TrimSpace(string(runes[:limit]))
}
