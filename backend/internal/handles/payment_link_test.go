package handles

import "testing"

// The payment link is the only field on a profile that asks a stranger for
// money, so what it may point at is the whole of its security.
func TestPaymentLinkTakesOnlyTheTwoProviders(t *testing.T) {
	accepted := []string{
		"https://payme.uz/a1b2c3",
		"payme.uz/@aziz",
		"https://p.payme.uz/xyz",
		"https://my.click.uz/pay/12345",
		"CLICK.UZ/pay/abc",
	}
	for _, raw := range accepted {
		link, ok := paymentLink(raw)
		if !ok {
			t.Errorf("%q rad etildi, qabul qilinishi kerak edi", raw)
			continue
		}
		if link.Kind != "payment" {
			t.Errorf("%q: kind = %q", raw, link.Kind)
		}
	}

	refused := []string{
		// The point of the allowlist. Any of these would render on a public
		// profile as "pay here" — a phishing page under our domain's name.
		"https://payme.uz.evil.com/a1b2c3",
		"https://evil.com/payme.uz",
		"https://paymeuz.com/x",
		"https://t.me/aziz",
		// The tricks WebsiteLink already refuses, checked again here because
		// this field is the one where they would pay.
		"javascript:alert(1)",
		"https://payme.uz@evil.com/x",
		"",
		"   ",
	}
	for _, raw := range refused {
		if _, ok := paymentLink(raw); ok {
			t.Errorf("%q qabul qilindi, rad etilishi kerak edi", raw)
		}
	}
}

// It leads, because it is the only link on the profile that ends in the owner
// being paid.
func TestPaymentLinkComesFirst(t *testing.T) {
	links := BuildLinks(LinkInput{
		Telegram: "aziz",
		Website:  "example.uz",
		Payment:  "https://payme.uz/a1b2c3",
	})

	if len(links) != 3 {
		t.Fatalf("%d ta havola, 3 ta kutilgandi", len(links))
	}
	if links[0].Kind != "payment" {
		t.Errorf("birinchisi %q, to'lov bo'lishi kerak edi", links[0].Label)
	}
}

// An owner who has not set one, or set a bad one, gets a profile without the
// button rather than a profile that fails to save.
func TestABadPaymentLinkIsDroppedNotFatal(t *testing.T) {
	links := BuildLinks(LinkInput{Telegram: "aziz", Payment: "https://evil.com/pay"})

	if len(links) != 1 || links[0].Label != "Telegram" {
		t.Errorf("kutilgani faqat Telegram, olingani %v", links)
	}
}
