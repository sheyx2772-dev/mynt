package auth

import (
	"crypto/rand"
	"math/big"
	"regexp"
	"strings"
)

// Phone numbers.
//
// Stored as E.164 without the plus — 998901234567 — which is the only form that
// is unambiguous across countries, because the country code is part of the
// number. "+998 90 123 45 67", "998901234567" and "90 123 45 67" are one
// number rather than three accounts.
//
// The product sells in Uzbekistan today and will not always. So the shape this
// accepts is E.164 rather than Uzbek, the country is worked out and stored
// beside the number rather than assumed, and a bare local number is completed
// with a default region — which is the one thing that genuinely has to change
// when a second country opens, and it is one constant.

// E.164: a country code that does not start with zero, then up to fourteen more
// digits. A number written for a local dialling plan starts with a zero or a
// trunk prefix and has not been normalised.
var e164 = regexp.MustCompile(`^[1-9][0-9]{7,14}$`)

// Where a bare local number is assumed to be from.
//
// Uzbekistan, because that is where the product sells and where "90 123 45 67"
// is what somebody writes on a card. When a second market opens this comes from
// the request — the app knows which country it is in — and this is the fallback.
const DefaultDialCode = "998"

// The countries this could plausibly reach, longest dial code first so that
// 998 is matched before 9 could be.
//
// Not a complete list, and it does not need to be: an unrecognised number is
// still accepted and stored with no country, which is honest — it can be sent
// to if a provider covers it, and it should not be labelled wrongly. The list
// is what lets a report say where customers are, and what will let a sender be
// chosen per country when there is more than one.
var dialCodes = []struct {
	prefix  string
	country string
	// National digits after the dial code. Zero means we do not check, which is
	// the right answer for a country whose plan we have not looked up.
	national int
}{
	{"998", "UZ", 9},
	{"992", "TJ", 9},
	{"996", "KG", 9},
	{"971", "AE", 9},
	{"90", "TR", 10},
	{"77", "KZ", 9},
	{"44", "GB", 0},
	{"7", "RU", 10},
	{"1", "US", 10},
}

// NormalisePhone turns what somebody typed into the stored form and the country
// it belongs to.
//
// The country is empty when the number is valid E.164 but not one we recognise.
// That is deliberate: refusing it would be refusing a customer for the sake of
// a list we made up, and guessing would put a wrong label on a real number.
func NormalisePhone(raw string) (phone, country string, ok bool) {
	var digits strings.Builder
	for _, c := range raw {
		if c >= '0' && c <= '9' {
			digits.WriteRune(c)
		}
	}
	phone = digits.String()

	// A bare national number, written the way it appears on a card here.
	if len(phone) == 9 && !strings.HasPrefix(phone, "0") {
		if !startsWithKnownDialCode(phone) {
			phone = DefaultDialCode + phone
		}
	}

	if !e164.MatchString(phone) {
		return "", "", false
	}

	for _, code := range dialCodes {
		if !strings.HasPrefix(phone, code.prefix) {
			continue
		}
		// A dial code we know the plan for is checked against it, so a
		// mistyped Uzbek number is refused rather than stored as an
		// unreachable one.
		if code.national > 0 && len(phone)-len(code.prefix) != code.national {
			continue
		}
		return phone, code.country, true
	}

	return phone, "", true
}

// startsWithKnownDialCode stops a nine-digit number that already carries a
// short dial code — a Russian or American one, say — from having 998 put in
// front of it.
func startsWithKnownDialCode(phone string) bool {
	for _, code := range dialCodes {
		if len(code.prefix) >= len(phone) {
			continue
		}
		if strings.HasPrefix(phone, code.prefix) &&
			code.national > 0 && len(phone)-len(code.prefix) == code.national {
			return true
		}
	}
	return false
}

// Six digits, which is what fits in a message somebody reads off a lock screen.
const phoneCodeDigits = 6

// NewPhoneCode returns a code and the hash to store for it.
//
// Six digits is a million possibilities, which is not many — a code is
// guessable in a way a session token is not. What makes it safe is not its
// length but the three attempts it allows and the minutes it lives, and both
// are enforced in SQL rather than here.
//
// Read from crypto/rand rather than math/rand: a sign-in code from a seeded
// generator is a sign-in code somebody else can generate.
func NewPhoneCode() (code string, hash []byte, err error) {
	limit := big.NewInt(1)
	for range phoneCodeDigits {
		limit.Mul(limit, big.NewInt(10))
	}

	n, err := rand.Int(rand.Reader, limit)
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
