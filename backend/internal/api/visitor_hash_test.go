package api

import (
	"net/netip"
	"testing"
)

// The owner's question is "how many people", not "which". These are the
// properties that keeps true.
func TestVisitorHash(t *testing.T) {
	one := netip.MustParseAddr("203.0.113.7")
	two := netip.MustParseAddr("203.0.113.8")

	// Same visitor, same day, same row.
	if visitorHash(&one, "Chrome") != visitorHash(&one, "Chrome") {
		t.Error("the same visitor hashed differently twice in one day")
	}
	// Different people are different rows.
	if visitorHash(&one, "Chrome") == visitorHash(&two, "Chrome") {
		t.Error("two addresses hashed the same")
	}
	if visitorHash(&one, "Chrome") == visitorHash(&one, "Safari") {
		t.Error("two browsers hashed the same")
	}
	// No address is no visitor, not a hash of the empty string — which would
	// make every anonymous visit look like one returning person.
	if visitorHash(nil, "Chrome") != "" {
		t.Error("hashed a missing address")
	}
	// And the address itself must not be recoverable from the row.
	if h := visitorHash(&one, "Chrome"); len(h) != 32 {
		t.Errorf("hash is %d characters, expected a truncated digest", len(h))
	}
}
