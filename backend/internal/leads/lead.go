// Package leads is the reverse of everything else on a card.
//
// Instead of the owner handing over their details, the visitor leaves theirs.
// That makes it the one endpoint here that anybody can reach without an
// account, on behalf of a profile they do not own — so every value in it is
// hostile until checked, and the checks are the whole of this file.
package leads

import (
	"regexp"
	"strings"
	"time"
)

// Where the visitor was standing. Only the markers we issue in our own links
// are kept: the parameter sits in a URL anybody can edit, and an owner's
// breakdown should not be whatever a passer-by decided to type.
var knownSources = map[string]bool{"nfc": true, "qr": true, "share": true}

func readSource(raw string) string {
	if knownSources[raw] {
		return raw
	}
	return ""
}

var (
	phonePattern = regexp.MustCompile(`^[0-9+()\- ]{7,30}$`)
	emailPattern = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
)

// Lead is a contact as the owner reads it back.
type Lead struct {
	ID      int64  `json:"id"`
	Name    string `json:"ism"`
	Phone   string `json:"telefon,omitempty"`
	Email   string `json:"email,omitempty"`
	Company string `json:"kompaniya,omitempty"`
	Note    string `json:"izoh,omitempty"`
	Source  string `json:"manba,omitempty" enum:"nfc,qr,share"`

	CreatedAt time.Time `json:"vaqt"`

	// The owner's own side of the row: where it has got to, what they wrote
	// against it, when to chase it. Separate from the fields above, which are
	// a record of what somebody said and are not editable.
	Stage       string   `json:"holat,omitempty"`
	OwnerNote   string   `json:"oz_izoh,omitempty"`
	FollowUpOn  string   `json:"eslatma,omitempty"`
	LastTouchAt string   `json:"oxirgi_teginish,omitempty"`
	Tags        []string `json:"teglar"`
}

// Input is what a visitor fills in.
type Input struct {
	Name    string `json:"ism" maxLength:"80" doc:"Majburiy"`
	Phone   string `json:"telefon,omitempty" maxLength:"30"`
	Email   string `json:"email,omitempty" maxLength:"120"`
	Company string `json:"kompaniya,omitempty" maxLength:"80"`
	Note    string `json:"izoh,omitempty" maxLength:"500"`
	Source  string `json:"manba,omitempty" enum:"nfc,qr,share"`
}

// Checked is an Input that has been through Read, so nothing downstream has to
// wonder whether it was.
type Checked struct {
	Name    string
	Phone   string
	Email   string
	Company string
	Note    string
	Source  string
}

// Read validates a submission, or returns the sentence to show the person.
//
// The database refuses a row with neither a phone nor an address; saying so
// here, in words somebody can act on, is better than a failed insert becoming
// "something went wrong".
func Read(in Input) (Checked, string) {
	name := trim(in.Name, 80)
	if name == "" {
		return Checked{}, "Ismingizni yozing."
	}

	phone := trim(in.Phone, 30)
	if phone != "" && !phonePattern.MatchString(phone) {
		phone = ""
	}
	email := strings.ToLower(trim(in.Email, 120))
	if email != "" && !emailPattern.MatchString(email) {
		email = ""
	}

	if phone == "" && email == "" {
		// The two messages are different on purpose: somebody who typed
		// nothing needs to be told what to type, and somebody who typed
		// something needs to be told it was not accepted.
		if trim(in.Phone, 30) != "" || trim(in.Email, 120) != "" {
			return Checked{}, "Telefon yoki emailni tekshiring."
		}
		return Checked{}, "Telefon yoki email — bittasi kerak."
	}

	return Checked{
		Name:    name,
		Phone:   phone,
		Email:   email,
		Company: trim(in.Company, 80),
		Note:    trim(in.Note, 500),
		Source:  readSource(in.Source),
	}, ""
}

// trim cuts by rune rather than by byte: Uzbek is written with multi-byte
// characters and a byte-wise cut stores invalid UTF-8.
func trim(s string, limit int) string {
	s = strings.TrimSpace(s)
	runes := []rune(s)
	if len(runes) <= limit {
		return s
	}
	return strings.TrimSpace(string(runes[:limit]))
}
