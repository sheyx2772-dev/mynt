package stats

import "testing"

func TestTheWindowIsBounded(t *testing.T) {
	// A caller asking for ten years would otherwise get a sequential scan of
	// the whole table, from a route anybody with an account can reach.
	if got := Days(10_000); got != MaxDays {
		t.Errorf("999 kun → %d, chegara %d", got, MaxDays)
	}
	// Zero is what a caller who omitted the parameter sends, and zero days of
	// history is an empty chart nobody asked for.
	if got := Days(0); got != DefaultDays {
		t.Errorf("0 kun → %d, standart %d", got, DefaultDays)
	}
	if got := Days(-30); got != DefaultDays {
		t.Errorf("manfiy kun → %d", got)
	}
	if got := Days(7); got != 7 {
		t.Errorf("7 kun → %d", got)
	}
}
