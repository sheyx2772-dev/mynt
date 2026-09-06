package handles

import (
	"regexp"
	"strings"
)

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
	AvatarURL    string
	BannerURL    string
	CommentsOpen bool
	Private      bool
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

	// Already-uploaded addresses. The caller puts the file in the image store
	// and sends where it went; nothing here fetches what is at them.
	AvatarURL string `json:"avatarUrl,omitempty" maxLength:"500"`
	BannerURL string `json:"bannerUrl,omitempty" maxLength:"500"`
	// Whether strangers may write on the profile. Sent every time, because it
	// is a switch: absent would be indistinguishable from off.
	CommentsOpen bool `json:"commentsOpen"`
	// Closed profile: strangers see the face and ask to see the rest. A switch
	// like commentsOpen, and sent every time for the same reason.
	Yopiq bool `json:"yopiq"`
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
		AvatarURL:    trim(in.AvatarURL, 500),
		BannerURL:    trim(in.BannerURL, 500),
		CommentsOpen: in.CommentsOpen,
		Private:      in.Yopiq,
	}, ""
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
