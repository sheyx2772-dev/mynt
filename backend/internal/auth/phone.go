package auth

import (
	"crypto/rand"
	"math/big"
	"regexp"
	"strings"
)

// Phone numbers, and the codes sent to them.
//
// A number is stored one way — 998901234567 — so that "+998 90 123 45 67",
// "998901234567" and "90 123 45 67" are one number rather than three accounts.

// Uzbek mobile numbers are twelve digits with the country code. Landlines and
// short codes cannot receive an SMS from a sender name, so they are not numbers
// this can sign anybody in with.
var phoneShape = regexp.MustCompile(`^998[0-9]{9}$`)

// NormalisePhone turns what somebody typed into the stored form.
//
// Everything that is not a digit is dropped, then the two shapes people
// actually type are completed: a bare nine digits gets the country code, and
// twelve that already start with 998 are left alone. Anything else is not a
// number this can send to.
func NormalisePhone(raw string) (string, bool) {
	var digits strings.Builder
	for _, c := range raw {
		if c >= '0' && c <= '9' {
			digits.WriteRune(c)
		}
	}

	phone := digits.String()
	// Nine digits is how a number is written on a card here: 90 123 45 67.
	if len(phone) == 9 {
		phone = "998" + phone
	}

	if !phoneShape.MatchString(phone) {
		return "", false
	}
	return phone, true
}

// Six digits, which is what fits in a message somebody reads off a lock screen.
const phoneCodeDigits = 6

// NewPhoneCode returns a code and the hash to store for it.
//
// Six digits is a million possibilities, which is not many — a code is
// guessable in a way a session token is not. What makes it safe is not its
// length but the three attempts it allows and the fifteen minutes it lives, and
// both of those are enforced in SQL rather than here.
//
// Read from crypto/rand rather than math/rand: a sign-in code from a seeded
// generator is a sign-in code somebody else can generate.
func NewPhoneCode() (code string, hash []byte, err error) {
	max := big.NewInt(1)
	for range phoneCodeDigits {
		max.Mul(max, big.NewInt(10))
	}

	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", nil, err
	}

	// Zero-padded, so 000042 is a code and not a four-digit one.
	code = leftPad(n.String(), phoneCodeDigits)
	return code, HashToken(code), nil
}

func leftPad(s string, width int) string {
	if len(s) >= width {
		return s
	}
	return strings.Repeat("0", width-len(s)) + s
}
