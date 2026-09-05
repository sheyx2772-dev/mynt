package admin

import "testing"

// A column name from outside must never survive as one.
func TestPickRefusesAnythingNotOnTheList(t *testing.T) {
	for _, key := range []string{"", "amount; drop table orders", "user_id", "RAQAM"} {
		got := OrderSort(key, false)
		if got.Key != "ochilgan" || !got.Descending {
			t.Errorf("OrderSort(%q) = %+v, want the default", key, got)
		}
	}
}

func TestPickKeepsAKnownKeyAndItsDirection(t *testing.T) {
	if got := OrderSort("summa", false); got.Key != "summa" || got.Descending {
		t.Errorf("OrderSort(summa, asc) = %+v", got)
	}
	// Each list has its own columns: "summa" is an order's, not an account's.
	if got := AccountSort("summa", true); got.Key != "tolagan" {
		t.Errorf("AccountSort(summa) = %+v, want the accounts default", got)
	}
	if got := HandleSort("tarif", true); got.Key != "tarif" || !got.Descending {
		t.Errorf("HandleSort(tarif, desc) = %+v", got)
	}
}
