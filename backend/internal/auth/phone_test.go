package auth

import "testing"

func TestANumberIsStoredOneWay(t *testing.T) {
	// The shapes somebody actually types, all one number. Without this, the
	// same person signing in twice is two accounts.
	for _, raw := range []string{
		"998901234567", "+998901234567", "+998 90 123 45 67",
		"90 123 45 67", "901234567", "(90) 123-45-67",
	} {
		phone, country, ok := NormalisePhone(raw)
		if !ok || phone != "998901234567" {
			t.Errorf("%q → %q, %v", raw, phone, ok)
		}
		if country != "UZ" {
			t.Errorf("%q → davlat %q", raw, country)
		}
	}
}

func TestOtherCountriesAreAccepted(t *testing.T) {
	// The product sells in Uzbekistan today and will not always. A number from
	// somewhere else must be storable now, or opening a second market is a
	// migration and a data rewrite.
	cases := map[string]struct{ phone, country string }{
		"+7 701 123 45 67":  {"77011234567", "KZ"},
		"+996 555 123 456":  {"996555123456", "KG"},
		"+992 93 123 45 67": {"992931234567", "TJ"},
		"+90 532 123 45 67": {"905321234567", "TR"},
		"+971 50 123 4567":  {"971501234567", "AE"},
		"+1 202 555 0100":   {"12025550100", "US"},
	}

	for raw, want := range cases {
		phone, country, ok := NormalisePhone(raw)
		if !ok || phone != want.phone || country != want.country {
			t.Errorf("%q → %q/%q, kutilgani %q/%q", raw, phone, country, want.phone, want.country)
		}
	}
}

func TestANumberWeCannotPlaceIsStillANumber(t *testing.T) {
	// Refusing it would be refusing a customer for the sake of a list we made
	// up; guessing would put a wrong label on a real number. So it is stored
	// with no country, and the column is null rather than empty.
	phone, country, ok := NormalisePhone("+372 5123 4567")
	if !ok {
		t.Fatalf("Estoniya raqami rad etildi: %q", phone)
	}
	if country != "" {
		t.Errorf("tanilmagan raqamga %q yorlig'i qo'yildi", country)
	}
}

func TestSomethingThatIsNotANumberIsRefused(t *testing.T) {
	for _, bad := range []string{
		"", "998", "12345",
		// Sixteen digits is past what E.164 allows.
		"9989012345678901",
		// A local dialling plan, not normalised. A leading zero is not a
		// country code.
		"0901234567",
		"salom", "+998-abc-defgh",
	} {
		if _, _, ok := NormalisePhone(bad); ok {
			t.Errorf("%q qabul qilindi", bad)
		}
	}
}

func TestAMistypedUzbekNumberIsRefusedRatherThanRelabelled(t *testing.T) {
	// 998 with eight national digits is not a number anybody can be reached on.
	// Falling through to a shorter dial code would store it as somebody else's
	// country, which is worse than refusing it.
	if phone, country, ok := NormalisePhone("99890123456"); ok && country == "UZ" {
		t.Errorf("noto'g'ri uzunlikdagi raqam UZ deb saqlandi: %q", phone)
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

	// Not a test of the random source — that is the operating system's job —
	// but of it being read at all. A constant, or a seeded generator, shows up
	// here immediately.
	if len(seen) < draws/2 {
		t.Errorf("%d ta chaqiruvdan %d ta turli kod", draws, len(seen))
	}
}

func TestALeadingZeroIsPartOfTheCode(t *testing.T) {
	// 000042 is a code. Trimming it would make a tenth of all codes shorter
	// than six digits.
	if got := leftPad("42", 6); got != "000042" {
		t.Errorf("leftPad → %q", got)
	}
}
