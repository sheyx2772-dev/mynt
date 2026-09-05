// Package promo is the discount a code gives, and the rules about when it may.
//
// The arithmetic is here and pure; whether a code may be used at all is decided
// by a single statement in Postgres — see store.go, and the migration, for why.
package promo

import (
	"regexp"
	"strings"
)

// The three shapes, because they answer different questions. A percentage is
// what a campaign announces, a fixed sum is what a person understands, and free
// months are what a subscription actually wants — the price does not move, the
// expiry does.
const (
	KindPercent = "percent"
	KindAmount  = "amount"
	KindMonths  = "months"
)

// What an order is for. A code says which of these it works on.
const (
	ForHandle       = "handle"
	ForSubscription = "subscription"
	ForDevice       = "device"
	ForVenue        = "venue"
)

// Typed off a poster, so stored and compared in one case.
var codePattern = regexp.MustCompile(`^[A-Z0-9-]{3,32}$`)

// Normalise turns what somebody typed into the stored form, or reports that it
// could never be a code. Trimmed and upper-cased, so "  yoz2026 " is "YOZ2026".
func Normalise(raw string) (string, bool) {
	code := strings.ToUpper(strings.TrimSpace(raw))
	return code, codePattern.MatchString(code)
}

// Code is a promo code as the rules see it.
type Code struct {
	Code string
	Kind string
	// Per kind: a percentage, a number of so'm, or a number of months.
	Value int32
	// A ceiling on a percentage, in so'm. Zero means none.
	MaxDiscount int64
}

// Discount is what a code took off, and what it added.
//
// Both, rather than one number, because months are not money: a subscription
// code leaves the price alone and moves the expiry, and collapsing the two
// would mean either charging nothing or granting nothing.
type Discount struct {
	Code string `json:"kod"`
	// So'm off the price. Never more than the price.
	Amount int64 `json:"chegirma"`
	// Extra months granted, for a subscription.
	Months int32 `json:"oylar"`
}

// Apply works out what a code is worth against a price.
//
// `price` is what the server computed, never what a client sent. The result is
// clamped so a discount cannot exceed the price — a negative total is an order
// the payment provider would refuse, and a free one is a decision nobody made.
func Apply(code Code, price int64) Discount {
	out := Discount{Code: code.Code}

	switch code.Kind {
	case KindMonths:
		out.Months = code.Value

	case KindAmount:
		out.Amount = int64(code.Value)

	case KindPercent:
		// Integer arithmetic throughout: a percentage of a price in so'm has no
		// business becoming a float and coming back with a fraction of a tiyin.
		out.Amount = price * int64(code.Value) / 100
		if code.MaxDiscount > 0 && out.Amount > code.MaxDiscount {
			// Twenty per cent of a hundred and twenty million is twenty-four
			// million, which is not what anybody meant by "twenty per cent off".
			out.Amount = code.MaxDiscount
		}
	}

	if out.Amount > price {
		out.Amount = price
	}
	if out.Amount < 0 {
		out.Amount = 0
	}

	return out
}
