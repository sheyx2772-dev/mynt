package auth

import "testing"

func TestANumberIsStoredOneWay(t *testing.T) {
	// The four shapes somebody actually types, all one number. Without this,
	// the same person signing in twice is two accounts.
	for _, raw := range []string{
		"998901234567", "+998901234567", "+998 90 123 45 67",
		"90 123 45 67", "901234567", "(90) 123-45-67",
	} {
		got, ok := NormalisePhone(raw)
		if !ok || got != "998901234567" {
			t.Errorf("%q → %q, %v", raw, got, ok)
		}
	}
}

func TestSomethingThatCannotReceiveAnSMSIsRefused(t *testing.T) {
	for _, bad := range []string{
		"", "998", "99890123456", "9989012345678",
		// A different country. This product sends through an Uzbek operator
		// with an approved sender name; anything else is a message that costs
		// money and does not arrive.
		"79001234567", "12025550100",
		// A landline and a short code cannot take a sender-name SMS.
		"1234", "0",
		"salom", "+998-abc-defgh",
	} {
		if _, ok := NormalisePhone(bad); ok {
			t.Errorf("%q qabul qilindi", bad)
		}
	}
}

func TestACodeIsSixDigitsAndUnpredictable(t *testing.T) {
	const draws = 500
	seen := map[string]int{}

	for range draws {
		code, hash, err := NewPhoneCode()
		if err != nil {
			t.Fatalf("kod olinmadi: %v", err)
		}
		if len(code) != 6 {
			t.Fatalf("kod %q — olti raqam bo'lishi kerak", code)
		}
		for _, c := range code {
			if c < '0' || c > '9' {
				t.Fatalf("kodda raqam emas: %q", code)
			}
		}
		if len(hash) != 32 {
			t.Errorf("hash %d bayt", len(hash))
		}
		seen[code]++
	}

	// Not a test of the random source — that is the operating system's job — but
	// of it being read at all. A constant, or a seeded generator, shows here.
	if len(seen) < draws/2 {
		t.Errorf("%d ta chaqiruvdan %d ta turli kod", draws, len(seen))
	}
}

func TestALeadingZeroIsPartOfTheCode(t *testing.T) {
	// 000042 is a code. Trimming it to "42" would make a fifth of all codes
	// shorter than six digits and a tenth of them shorter than five.
	if got := leftPad("42", 6); got != "000042" {
		t.Errorf("leftPad → %q", got)
	}
}
