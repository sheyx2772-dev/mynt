package payments

import "testing"

// Cancelling, which Payme's sandbox checks separately from paying — and which
// an integrator gets backwards, because the two terminal states look alike.
// The harness lives in payme_handler_test.go.

func TestCancelBeforePaymentIsMinusOneAndAfterIsMinusTwo(t *testing.T) {
	// The distinction certification checks, and the one an integrator gets
	// backwards: -1 is a cancellation, -2 is a refund.
	before := newFakeStore()
	create(t, before, "tx-1", t0)
	res := resultOf(t, call(t, before, "CancelTransaction", map[string]any{"id": "tx-1", "reason": float64(3)}, t0+100))
	if res["state"] != StateCancelled {
		t.Errorf("to'lovdan oldin bekor qilish → %v, kutilgani %d", res["state"], StateCancelled)
	}

	after := newFakeStore()
	create(t, after, "tx-1", t0)
	call(t, after, "PerformTransaction", map[string]any{"id": "tx-1"}, t0+100)
	res = resultOf(t, call(t, after, "CancelTransaction", map[string]any{"id": "tx-1", "reason": float64(5)}, t0+200))
	if res["state"] != StateCancelledAfterPerform {
		t.Errorf("to'lovdan keyin bekor qilish → %v, kutilgani %d", res["state"], StateCancelledAfterPerform)
	}
}

func TestCancelIsIdempotentAndKeepsItsCancelTime(t *testing.T) {
	s := newFakeStore()
	create(t, s, "tx-1", t0)

	first := resultOf(t, call(t, s, "CancelTransaction", map[string]any{"id": "tx-1"}, t0+100))
	second := resultOf(t, call(t, s, "CancelTransaction", map[string]any{"id": "tx-1"}, t0+9_999))

	if first["cancel_time"] != second["cancel_time"] {
		t.Errorf("cancel_time siljidi: %v → %v", first["cancel_time"], second["cancel_time"])
	}
}
