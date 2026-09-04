package orders

import (
	"encoding/base64"
	"net/url"
	"strings"
	"testing"
)

// These addresses send somebody to a payment page with an amount on it. A
// mistake here is a customer charged the wrong sum, so the parts are asserted
// rather than eyeballed.

func TestPaymeIsGivenTiyinNotSom(t *testing.T) {
	link := PaymeCheckoutURL("merchant-1", "order-1", 4_500_000, "")

	payload, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(link, "https://checkout.paycom.uz/"))
	if err != nil {
		t.Fatalf("payload base64 emas: %v", err)
	}

	// 4 500 000 so'm is 450 000 000 tiyin. A factor of a hundred either way is
	// the classic way to charge the wrong amount.
	want := "m=merchant-1;ac.order_id=order-1;a=450000000"
	if string(payload) != want {
		t.Errorf("payload %q, kutilgani %q", payload, want)
	}
}

func TestPaymeCarriesTheReturnAddressOnlyWhenThereIsOne(t *testing.T) {
	with := decode(t, PaymeCheckoutURL("m", "o", 100, "https://flex.com.uz/kabinet"))
	if !strings.Contains(with, ";c=https://flex.com.uz/kabinet") {
		t.Errorf("qaytish manzili yo'q: %q", with)
	}

	without := decode(t, PaymeCheckoutURL("m", "o", 100, ""))
	if strings.Contains(without, ";c=") {
		t.Errorf("bo'sh qaytish manzili qo'shildi: %q", without)
	}
}

func TestClickIsGivenSomNotTiyin(t *testing.T) {
	link, err := url.Parse(ClickCheckoutURL("99108", "merchant-1", "order-1", 4_500_000, ""))
	if err != nil {
		t.Fatalf("manzil o'qilmadi: %v", err)
	}

	if got := link.Host + link.Path; got != "my.click.uz/services/pay" {
		t.Errorf("manzil %q", got)
	}
	// Click counts in so'm, Payme in tiyin. The two providers disagreeing about
	// this is exactly the kind of thing a test has to hold still.
	if got := link.Query().Get("amount"); got != "4500000" {
		t.Errorf("summa %q, kutilgani 4500000", got)
	}
	if got := link.Query().Get("transaction_param"); got != "order-1" {
		t.Errorf("buyurtma %q", got)
	}
}

func TestClickEscapesWhatGoesIntoTheQuery(t *testing.T) {
	// The order id is a uuid we generated, but the return address is built from
	// configuration, and neither should be able to add a parameter of its own.
	link, err := url.Parse(ClickCheckoutURL("1", "2", "3", 100, "https://flex.com.uz/x?a=b&amount=1"))
	if err != nil {
		t.Fatalf("manzil o'qilmadi: %v", err)
	}
	if got := link.Query().Get("amount"); got != "100" {
		t.Errorf("summa qaytish manzili orqali o'zgardi: %q", got)
	}
}

func decode(t *testing.T, link string) string {
	t.Helper()
	payload, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(link, "https://checkout.paycom.uz/"))
	if err != nil {
		t.Fatalf("payload base64 emas: %v", err)
	}
	return string(payload)
}
