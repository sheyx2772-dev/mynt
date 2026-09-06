package orders

import "time"

// Providers is what is configured to take money, and how to send a buyer there.
//
// Both are optional and the site works without either — the number is claimed
// outright and free, which is what development and a preview deployment want.
// That behaviour is not a convenience: it is what the website already does, and
// two halves of one product disagreeing about whether a number costs anything
// would be worse than either answer.
type Providers struct {
	PaymeMerchantID string

	ClickServiceID  string
	ClickMerchantID string

	// Where a provider sends the buyer when they are done — the site, at the
	// order's own address, which the app also claims as a deep link so that
	// somebody who paid from the app comes back to the app.
	//
	// Not where the money is confirmed. That arrives on the website's own
	// callbacks, which are the endpoints registered in the merchant cabinets.
	SiteURL string
}

func (p Providers) HasPayme() bool { return p.PaymeMerchantID != "" }

func (p Providers) HasClick() bool {
	return p.ClickServiceID != "" && p.ClickMerchantID != ""
}

// Any reports whether anybody can be charged at all.
func (p Providers) Any() bool { return p.HasPayme() || p.HasClick() }

// GiveAway reports whether a number should be handed over free.
//
// Only in development, and this is narrower than it looks. The website decides
// the same question from the merchant id *and* the secret key; this process
// only ever sees the id, because the key belongs where the protocol is. So the
// two can disagree — an id set here without a key set there, or the reverse —
// and the dangerous direction is this one giving away a number worth millions
// because a variable was missing.
//
// Production therefore refuses to sell rather than defaulting to free. A
// misconfigured deployment stops taking orders, which somebody notices within
// the hour, instead of quietly handing out numbers nobody paid for.
func (p Providers) GiveAway(development bool) bool { return development && !p.Any() }

// Checkout is where to send a buyer for one order.
type Checkout struct {
	Payme string `json:"payme,omitempty"`
	Click string `json:"click,omitempty"`
}

// checkoutFor builds the payment addresses for one order.
//
// `path` is where the buyer lands afterwards, given per order rather than as a
// constant: somebody coming back from a payment page should see the thing they
// just paid for, and on a phone that address opens the app rather than a
// website they are not signed into. A device sends them on to the address form,
// because the money is only half of what is needed from them and a buyer who
// lands anywhere else has to be chased for the other half.
func (p Providers) checkoutFor(orderID, path string, amountSum int64, validFor time.Duration) Checkout {
	returnURL := ""
	if p.SiteURL != "" {
		returnURL = p.SiteURL + path
	}

	var links Checkout
	if p.HasPayme() {
		links.Payme = PaymeCheckoutURL(p.PaymeMerchantID, orderID, amountSum, returnURL, validFor)
	}
	if p.HasClick() {
		links.Click = ClickCheckoutURL(p.ClickServiceID, p.ClickMerchantID, orderID, amountSum, returnURL)
	}
	return links
}

// returnPathFor is where a buyer lands when a provider is done with them.
//
// A number goes to the order page, which is where the claim is confirmed and
// which the app claims as a deep link. A device goes to the address form
// instead: it is the only screen that can finish the purchase, and a buyer who
// lands anywhere else has to be chased for an address. A subscription goes to
// the number itself, because there is nothing further to do.
func returnPathFor(kind, orderID string) string {
	switch kind {
	case "device":
		return "/kabinet/buyurtma/" + orderID
	case "gift":
		// The order page knows what a paid gift means and links to the profile.
		return "/buyurtma/" + orderID
	default:
		return "/buyurtma/" + orderID
	}
}
