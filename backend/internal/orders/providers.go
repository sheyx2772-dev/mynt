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

// Any reports whether anybody can be charged at all. With nobody configured a
// number is given away rather than sold.
func (p Providers) Any() bool { return p.HasPayme() || p.HasClick() }

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
