package promo

import "testing"

const million = int64(1_000_000)

func TestAPercentageIsTakenOffThePrice(t *testing.T) {
	got := Apply(Code{Code: "YOZ", Kind: KindPercent, Value: 20}, 500_000)
	if got.Amount != 100_000 {
		t.Errorf("20%% of 500 000 = %d", got.Amount)
	}
	if got.Months != 0 {
		t.Errorf("foizli kod oy berdi: %d", got.Months)
	}
}

func TestAPercentageIsCappedWhenAskedTo(t *testing.T) {
	// Twenty per cent of a number that costs a hundred and twenty million is
	// twenty-four million, and nobody who wrote "20% off" meant that.
	code := Code{Code: "YOZ", Kind: KindPercent, Value: 20, MaxDiscount: 2 * million}

	if got := Apply(code, 120*million); got.Amount != 2*million {
		t.Errorf("chegara ishlamadi: %d", got.Amount)
	}
	// Under the ceiling it is still a percentage.
	if got := Apply(code, 500_000); got.Amount != 100_000 {
		t.Errorf("chegaradan past summada foiz buzildi: %d", got.Amount)
	}
}

func TestADiscountNeverExceedsThePrice(t *testing.T) {
	// A hundred thousand off a hundred thousand is free, which is a decision
	// somebody makes deliberately. A hundred thousand off fifty is a negative
	// total, which no payment provider will take.
	got := Apply(Code{Code: "KATTA", Kind: KindAmount, Value: 500_000}, 100_000)
	if got.Amount != 100_000 {
		t.Errorf("narxdan katta chegirma o'tdi: %d", got.Amount)
	}
}

func TestMonthsLeaveThePriceAlone(t *testing.T) {
	// A subscription code moves the expiry, not the price. Collapsing the two
	// would mean either charging nothing or granting nothing.
	got := Apply(Code{Code: "3OY", Kind: KindMonths, Value: 3}, 49_000)
	if got.Months != 3 {
		t.Errorf("oylar: %d", got.Months)
	}
	if got.Amount != 0 {
		t.Errorf("oy beradigan kod narxni ham tushirdi: %d", got.Amount)
	}
}

func TestPercentagesUseIntegerArithmetic(t *testing.T) {
	// A price in so'm has no business becoming a float and coming back with a
	// fraction of a tiyin. 33% of 100 001 is 33 000.33, and the answer is
	// 33 000.
	if got := Apply(Code{Kind: KindPercent, Value: 33}, 100_001); got.Amount != 33_000 {
		t.Errorf("33%% of 100 001 = %d", got.Amount)
	}
}

func TestNormaliseAcceptsWhatSomebodyTypesOffAPoster(t *testing.T) {
	for raw, want := range map[string]string{
		"  yoz2026 ": "YOZ2026",
		"YOZ-2026":   "YOZ-2026",
		"abc":        "ABC",
	} {
		got, ok := Normalise(raw)
		if !ok || got != want {
			t.Errorf("%q → %q, %v", raw, got, ok)
		}
	}

	// Anything that could never be a code, including the shapes that would
	// otherwise reach a query.
	for _, bad := range []string{"", "  ", "ab", "yoz 2026", "YOZ_2026", "yoz'", "'; drop table promo_codes--"} {
		if _, ok := Normalise(bad); ok {
			t.Errorf("%q qabul qilindi", bad)
		}
	}
}
