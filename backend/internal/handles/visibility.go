package handles

import "encoding/json"

// Who sees which line of a profile.
//
// The closed profile is one switch for the whole page. This is the finer one,
// per field: a phone for followers only, an email for nobody but the owner,
// the Instagram for everyone. Decided here, on the server, for the same reason
// a closed profile is cut here — a field the page hides is still in the
// response, and a response is a file.

// The audiences, narrowest last. Open is the absence of an entry, so a profile
// that has never touched the setting reads exactly as it did before it existed.
const (
	AudienceFollowers = "obuna"
	AudienceOwner     = "yopiq"
)

// The fields an audience can be set on: the nine link fields the form has,
// plus the two ways of reaching a person that are not links.
var visibilityFields = map[string]bool{
	"payment": true, "booking": true, "telegram": true, "whatsapp": true,
	"instagram": true, "linkedin": true, "facebook": true, "youtube": true,
	"website": true, "telefon": true, "email": true,
}

// A stored link carries its label, not the field it came from. The labels are
// fixed by BuildLinks, so this is the way back.
var linkFieldByLabel = map[string]string{
	"To'lash": "payment", "Uchrashuv": "booking", "Telegram": "telegram",
	"WhatsApp": "whatsapp", "Instagram": "instagram", "LinkedIn": "linkedin",
	"Facebook": "facebook", "YouTube": "youtube", "Veb-sayt": "website",
}

// Visibility is the map as stored: field → audience, open fields absent.
type Visibility map[string]string

// ReadVisibility keeps what is meaningful and drops the rest, so a client
// sending a field it invented or an audience it made up narrows nothing.
func ReadVisibility(in map[string]string) Visibility {
	out := Visibility{}
	for field, audience := range in {
		if !visibilityFields[field] {
			continue
		}
		if audience == AudienceFollowers || audience == AudienceOwner {
			out[field] = audience
		}
	}
	return out
}

func decodeVisibility(raw []byte) Visibility {
	v := Visibility{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &v)
	}
	return v
}

// shows says whether a reader in the given standing may see a field.
func (v Visibility) shows(field string, following bool) bool {
	switch v[field] {
	case AudienceOwner:
		return false
	case AudienceFollowers:
		return following
	default:
		return true
	}
}

// ForReader cuts the profile to what this reader is allowed to see of it.
//
// The owner gets everything, and the map itself, so their own page can mark
// which lines are narrowed. Everybody else gets the lines open to their
// standing and no map — the map is a list of what is being kept from them.
func (p PublicProfile) ForReader(following bool) PublicProfile {
	if p.Mine {
		return p
	}

	v := p.Visibility
	kept := make([]Link, 0, len(p.Links))
	for _, link := range p.Links {
		if v.shows(linkFieldByLabel[link.Label], following) {
			kept = append(kept, link)
		}
	}
	p.Links = kept
	if !v.shows("telefon", following) {
		p.Phone = ""
	}
	if !v.shows("email", following) {
		p.Email = ""
	}
	p.Visibility = nil
	return p
}
