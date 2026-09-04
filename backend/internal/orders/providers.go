package orders

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

	// Where a provider sends the buyer when they are done. Not where the money
	// is confirmed — that arrives on the website's own callbacks, which are the
	// endpoints registered in the merchant cabinets.
	ReturnURL string
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

func (p Providers) checkoutFor(orderID string, amountSum int64) Checkout {
	var links Checkout
	if p.HasPayme() {
		links.Payme = PaymeCheckoutURL(p.PaymeMerchantID, orderID, amountSum, p.ReturnURL)
	}
	if p.HasClick() {
		links.Click = ClickCheckoutURL(p.ClickServiceID, p.ClickMerchantID, orderID, amountSum, p.ReturnURL)
	}
	return links
}
