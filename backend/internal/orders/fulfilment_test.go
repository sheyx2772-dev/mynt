package orders

import "testing"

// The steps a device order may take. Worth a test rather than a read-through,
// because the two exceptions to "forward only" are what make it look wrong: a
// returned parcel goes back into the queue, and something being made can be put
// back. Everything else moving backwards is a bug that would let the operator's
// screen unship a parcel that is already in the post.
func TestCanAdvance(t *testing.T) {
	allowed := [][2]string{
		{"address_needed", "queued"},
		{"queued", "making"},
		{"making", "shipped"},
		{"shipped", "delivered"},
		{"making", "queued"},
		{"returned", "queued"},
		{"delivered", "returned"},
	}
	for _, step := range allowed {
		if !canAdvance(step[0], step[1]) {
			t.Errorf("%s → %s ruxsat etilishi kerak edi", step[0], step[1])
		}
	}

	refused := [][2]string{
		// Nothing skips the address: a parcel with nowhere to go must not
		// reach the maker's queue as if it had one.
		{"address_needed", "making"},
		{"address_needed", "shipped"},
		// Backwards out of the post.
		{"shipped", "making"},
		{"delivered", "shipped"},
		{"queued", "address_needed"},
		// A state that is not one.
		{"queued", "yasaldi"},
		{"", "queued"},
	}
	for _, step := range refused {
		if canAdvance(step[0], step[1]) {
			t.Errorf("%s → %s rad etilishi kerak edi", step[0], step[1])
		}
	}
}

func TestDevicePrice(t *testing.T) {
	if price, ok := DevicePrice(Ring); !ok || price != 350_000 {
		t.Errorf("uzuk narxi %d, %v", price, ok)
	}
	// An unknown kind has no price at all rather than falling back to one.
	// A fallback here is a ring sold for the price of a card.
	if _, ok := DevicePrice("soat"); ok {
		t.Error("noma'lum qurilma narxlanmasligi kerak")
	}
}
