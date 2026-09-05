package payments

import (
	"context"
	"encoding/json"
	"testing"
)

// The cases Payme's sandbox certification actually checks. They are the reason
// this is a port rather than a rewrite: each one was found by failing it.

const (
	t0     = int64(1_700_000_000_000)
	price  = int64(99_000)
	tiyin  = float64(9_900_000)
	orderA = "order-1"
)

func clockAt(ms int64) Clock { return func() int64 { return ms } }

func call(t *testing.T, s Store, method string, params map[string]any, now int64) map[string]any {
	t.Helper()
	return HandlePayme(context.Background(), s, RPCRequest{
		ID:     json.RawMessage("1"),
		Method: method,
		Params: params,
	}, clockAt(now))
}

func account(orderID string) map[string]any {
	return map[string]any{"order_id": orderID}
}

func resultOf(t *testing.T, res map[string]any) map[string]any {
	t.Helper()
	out, ok := res["result"].(map[string]any)
	if !ok {
		t.Fatalf("natija emas: %v", res)
	}
	return out
}

func errorCode(t *testing.T, res map[string]any) int {
	t.Helper()
	out, ok := res["error"].(map[string]any)
	if !ok {
		t.Fatalf("xato emas: %v", res)
	}
	return out["code"].(int)
}

func create(t *testing.T, s Store, txID string, now int64) map[string]any {
	t.Helper()
	return call(t, s, "CreateTransaction", map[string]any{
		"id": txID, "time": float64(now), "amount": tiyin, "account": account(orderA),
	}, now)
}

func TestCreateIsIdempotentAndKeepsItsTimestamps(t *testing.T) {
	s := newFakeStore()

	first := resultOf(t, create(t, s, "tx-1", t0))
	// Payme retries with the same id and compares the answer. A create_time
	// that moves between the two calls fails certification.
	second := resultOf(t, create(t, s, "tx-1", t0+5_000))

	if first["create_time"] != second["create_time"] {
		t.Errorf("create_time siljidi: %v → %v", first["create_time"], second["create_time"])
	}
	if second["state"] != StateCreated {
		t.Errorf("holat %v", second["state"])
	}
}

func TestPerformIsIdempotentAndDoesNotPayTwice(t *testing.T) {
	s := newFakeStore()
	create(t, s, "tx-1", t0)

	first := resultOf(t, call(t, s, "PerformTransaction", map[string]any{"id": "tx-1"}, t0+1_000))
	second := resultOf(t, call(t, s, "PerformTransaction", map[string]any{"id": "tx-1"}, t0+9_000))

	if first["perform_time"] != second["perform_time"] {
		t.Errorf("perform_time siljidi: %v → %v", first["perform_time"], second["perform_time"])
	}
	if len(s.paidCalls) != 1 {
		t.Errorf("buyurtma %d marta to'landi", len(s.paidCalls))
	}
}

func TestATransactionOlderThanTwelveHoursCannotBePerformed(t *testing.T) {
	s := newFakeStore()
	create(t, s, "tx-1", t0)

	// One millisecond past the window.
	res := call(t, s, "PerformTransaction", map[string]any{"id": "tx-1"},
		t0+PaymeTimeout.Milliseconds()+1)

	if code := errorCode(t, res); code != ErrCantPerform {
		t.Errorf("xato kodi %d", code)
	}
	if s.paymeTxs["tx-1"].State != StateCancelled {
		t.Errorf("holat %d, bekor qilingan bo'lishi kerak", s.paymeTxs["tx-1"].State)
	}
	if len(s.paidCalls) != 0 {
		t.Error("muddati o'tgan tranzaksiya to'landi")
	}
}

func TestTheWrongAmountIsRefusedBeforeAnythingIsCreated(t *testing.T) {
	s := newFakeStore()

	res := call(t, s, "CheckPerformTransaction", map[string]any{
		"amount": float64(1), "account": account(orderA),
	}, t0)
	if code := errorCode(t, res); code != ErrInvalidAmount {
		t.Errorf("xato kodi %d", code)
	}

	// And a fractional tiyin is not a count of tiyin.
	res = call(t, s, "CheckPerformTransaction", map[string]any{
		"amount": tiyin + 0.5, "account": account(orderA),
	}, t0)
	if code := errorCode(t, res); code != ErrInvalidAmount {
		t.Errorf("kasrli summa qabul qilindi: %d", code)
	}
}

func TestAnUnknownOrderIsAnInvalidAccount(t *testing.T) {
	s := newFakeStore()

	for _, params := range []map[string]any{
		{"amount": tiyin, "account": account("yoq")},
		{"amount": tiyin, "account": map[string]any{}},
		{"amount": tiyin},
	} {
		res := call(t, s, "CheckPerformTransaction", params, t0)
		if code := errorCode(t, res); code != ErrInvalidAccount {
			t.Errorf("%v → %d, kutilgani %d", params, code, ErrInvalidAccount)
		}
	}
}

func TestOnlyOneLiveTransactionPerOrder(t *testing.T) {
	s := newFakeStore()
	create(t, s, "tx-1", t0)

	// A second payer reaching the same order must not get their own
	// transaction, or both could succeed.
	res := create(t, s, "tx-2", t0+1_000)
	if code := errorCode(t, res); code != ErrCantPerform {
		t.Errorf("ikkinchi tranzaksiya ochildi: %d", code)
	}
}

func TestAMethodPaymeDoesNotHaveIsRefused(t *testing.T) {
	res := call(t, newFakeStore(), "GetStatement", map[string]any{}, t0)
	if code := errorCode(t, res); code != ErrMethodNotFound {
		t.Errorf("xato kodi %d", code)
	}
}

func TestPaymeAuthIsTheMerchantKeyUnderTheNamePaycom(t *testing.T) {
	// Payme's Basic username is literally "Paycom" and the password is the key.
	// A header built any other way is refused, including the obvious guesses.
	const key = "sekret"
	valid := "Basic UGF5Y29tOnNla3JldA==" // base64("Paycom:sekret")

	if !VerifyAuth(valid, key) {
		t.Error("to'g'ri sarlavha rad etildi")
	}

	for _, header := range []string{
		"",
		"Basic ",
		"Bearer sekret",
		"Basic c2VrcmV0",             // just the key
		"Basic UGF5Y29tOndyb25n",     // Paycom:wrong
		"Basic cGF5Y29tOnNla3JldA==", // paycom, lowercase
		valid + " ",
	} {
		if VerifyAuth(header, key) {
			t.Errorf("%q qabul qilindi", header)
		}
	}

	// A deployment with no key must refuse everybody, including a valid header.
	if VerifyAuth(valid, "") {
		t.Error("kalitsiz qabul qilindi")
	}
}
