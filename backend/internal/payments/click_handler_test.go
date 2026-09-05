package payments

import (
	"context"
	"testing"
)

const secret = "sekret"

func signed(overrides func(*ClickRequest)) ClickRequest {
	req := ClickRequest{
		ClickTransID:      "click-1",
		ServiceID:         "99108",
		MerchantTransID:   orderA,
		MerchantPrepareID: orderA,
		Amount:            "99000",
		Action:            ClickActionPrepare,
		SignTime:          "2026-09-05 12:00:00",
	}
	if overrides != nil {
		overrides(&req)
	}
	req.SignString = ClickSignString(req, secret)
	return req
}

func TestClickRefusesASignatureItDidNotMake(t *testing.T) {
	s := newFakeStore()
	req := signed(nil)
	req.SignString = "00000000000000000000000000000000"

	res := HandleClickPrepare(context.Background(), s, req, secret, clockAt(t0))
	if res.Error != ClickSignCheckFailed {
		t.Errorf("xato kodi %d", res.Error)
	}
}

func TestClickFailsClosedWithNoSecret(t *testing.T) {
	// A deployment that lost its key must refuse payments, not accept them.
	res := HandleClickPrepare(context.Background(), newFakeStore(), signed(nil), "", clockAt(t0))
	if res.Error != ClickSignCheckFailed {
		t.Errorf("kalitsiz qabul qilindi: %d", res.Error)
	}
}

// Complete's signature inserts merchant_prepare_id and Prepare's does not.
// Getting that backwards rejects every payment, so both are pinned.
func TestTheTwoSignaturesAreDifferentFormulas(t *testing.T) {
	prepare := signed(nil)
	complete := signed(func(r *ClickRequest) { r.Action = ClickActionComplete })

	if prepare.SignString == complete.SignString {
		t.Fatal("ikkala imzo bir xil chiqdi")
	}
	// A complete signed as a prepare must not pass the complete endpoint.
	wrong := signed(nil)
	wrong.Action = ClickActionComplete
	res := HandleClickComplete(context.Background(), newFakeStore(), wrong, secret, clockAt(t0))
	if res.Error != ClickSignCheckFailed {
		t.Errorf("noto'g'ri formula bilan imzolangan so'rov o'tdi: %d", res.Error)
	}
}

func TestClickSettlesOnceAndAnswersSuccessOnRetry(t *testing.T) {
	s := newFakeStore()
	HandleClickPrepare(context.Background(), s, signed(nil), secret, clockAt(t0))

	complete := signed(func(r *ClickRequest) { r.Action = ClickActionComplete })
	first := HandleClickComplete(context.Background(), s, complete, secret, clockAt(t0+1000))
	second := HandleClickComplete(context.Background(), s, complete, secret, clockAt(t0+2000))

	if first.Error != ClickSuccess || second.Error != ClickSuccess {
		t.Errorf("javoblar: %d, %d", first.Error, second.Error)
	}
	// A retry must not buy the number twice.
	if len(s.paidCalls) != 1 {
		t.Errorf("%d marta to'landi", len(s.paidCalls))
	}
}

func TestClickRefusesAnOrderPaymeAlreadySettled(t *testing.T) {
	// The double charge. Payme performed while the buyer was in Click.
	s := newFakeStore()
	_ = s.MarkOrderPaid(context.Background(), orderA, "payme", "payme-tx-9")

	res := HandleClickComplete(context.Background(), s,
		signed(func(r *ClickRequest) { r.Action = ClickActionComplete }), secret, clockAt(t0))

	if res.Error != ClickTransactionCancelled {
		t.Errorf("xato kodi %d", res.Error)
	}
	if len(s.paidCalls) != 1 {
		t.Errorf("ikkinchi marta to'landi: %v", s.paidCalls)
	}
}

func TestClickRefusesWhenTheNumberIsNoLongerHeld(t *testing.T) {
	// Thirty minutes of reservation against a bank transfer that took longer.
	s := newFakeStore()
	s.handleLost = true

	res := HandleClickComplete(context.Background(), s,
		signed(func(r *ClickRequest) { r.Action = ClickActionComplete }), secret, clockAt(t0))

	if res.Error != ClickTransactionCancelled {
		t.Errorf("xato kodi %d", res.Error)
	}
	if len(s.paidCalls) != 0 {
		t.Error("raqam yo'q bo'lsa ham to'lov olindi")
	}
}

func TestClickAmountIsComparedInTiyin(t *testing.T) {
	// Click sends a decimal string, so "99000" and "99000.00" are the same
	// amount and float equality would say otherwise.
	for _, sent := range []string{"99000", "99000.00", " 99000 "} {
		if !ClickAmountMatches(sent, 99_000) {
			t.Errorf("%q rad etildi", sent)
		}
	}
	for _, sent := range []string{"99000.01", "9900", "990000", "", "abc", "1e5"} {
		if ClickAmountMatches(sent, 99_000) {
			t.Errorf("%q qabul qilindi", sent)
		}
	}
}

func TestAnUnparseableErrorFieldIsNotAFailureReport(t *testing.T) {
	// Click reports its own failure with a negative code. Treating noise as a
	// failure report would cancel orders for free.
	for _, raw := range []string{"", "0", "abc", "-", "-abc", "5"} {
		if failedAtClick(raw) {
			t.Errorf("%q xato hisoblandi", raw)
		}
	}
	for _, raw := range []string{"-1", "-9", "-31001"} {
		if !failedAtClick(raw) {
			t.Errorf("%q xato hisoblanmadi", raw)
		}
	}
}
