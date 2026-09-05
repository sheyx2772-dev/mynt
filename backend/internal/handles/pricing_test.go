package handles

import "testing"

// The prices here are the ones the website quotes. Both implementations are
// read by the same buyer — the site shows a price, the app shows a price, and
// the backend charges one — so a difference between them is a customer being
// asked for a number they were not shown.
func TestPriceMatchesWhatTheSiteQuotes(t *testing.T) {
	cases := []struct {
		handle string
		price  int
		why    string
	}{
		{"QXZ483", 100_000, "plain letters, plain digits"},
		{"AAA483", 3_000_000, "three identical letters"},
		{"VIP483", 2_000_000, "a word"},
		{"ABA483", 400_000, "palindrome letters"},
		{"QXZ777", 4_000_000, "three identical digits"},
		{"QXZ007", 1_500_000, "two leading zeros"},
		{"QXZ123", 1_200_000, "ascending run"},
		{"QXZ321", 1_200_000, "descending run"},
		{"QXZ121", 500_000, "palindrome digits"},
		{"AAA000", 120_000_000, "the most expensive shape there is"},
		{"VIP007", 30_000_000, "a word and two leading zeros"},
	}

	for _, c := range cases {
		parsed, ok := Parse(c.handle)
		if !ok {
			t.Fatalf("%s o'qilmadi", c.handle)
		}
		if got := parsed.Price(); got != c.price {
			t.Errorf("%s (%s) = %d, kutilgani %d", c.handle, c.why, got, c.price)
		}
	}
}

func TestParseAcceptsOnlyTheShapePrintedOnACard(t *testing.T) {
	// Lower case is what somebody types; the stored form is upper.
	if parsed, ok := Parse("myn042"); !ok || parsed.Normalized() != "MYN042" {
		t.Errorf("myn042 → %q, %v", parsed.Normalized(), ok)
	}
	if parsed, ok := Parse("  MYN042 "); !ok || parsed.Normalized() != "MYN042" {
		t.Errorf("bo'shliqli qiymat o'qilmadi: %q, %v", parsed.Normalized(), ok)
	}

	for _, bad := range []string{
		"", "MYN", "042", "MYN04", "MYN0422", "123042", "MYNABC",
		"MY-042", "MYN 042", "МЫН042", "MYN042'", "MYN042; drop table handles",
	} {
		if _, ok := Parse(bad); ok {
			t.Errorf("%q qabul qilindi, rad etilishi kerak edi", bad)
		}
	}
}

func TestParseSerialIsADifferentNamespace(t *testing.T) {
	if serial, ok := ParseSerial("000001"); !ok || serial != "000001" {
		t.Errorf("000001 → %q, %v", serial, ok)
	}
	// A handle is not a serial and a serial is not a handle. Six digits either
	// way would be ambiguous if the two shapes overlapped; they do not.
	for _, bad := range []string{"MYN042", "00001", "0000001", "", "abcdef"} {
		if _, ok := ParseSerial(bad); ok {
			t.Errorf("%q seriya sifatida qabul qilindi", bad)
		}
	}
}

// The words are a pricing tier, and they exist in two files: this one and
// `landing/src/lib/pricing.ts`. A word in one and not the other is the site
// quoting a hundred thousand and the server charging two million.
//
// Which list is which is pinned by fingerprint in blocked_test.go; this one
// pins what the tier *does*, with a sample from every group.
func TestTheWordTierIsWhatBothSidesThinkItIs(t *testing.T) {
	for _, word := range []string{
		"VIP", "CEO", "BEK", "UZB", "NUR", "ZAR", "LUX", "ONE",
		// The trades, which sell to a business rather than to a person.
		"GYM", "LAW", "MED", "WEB",
		// Uzbek, names and cities.
		"OSH", "PUL", "OTA", "ALI", "SAM", "BUX",
	} {
		if LetterRarity(word).Multiplier != 20 {
			t.Errorf("%s so'z tarifida emas", word)
		}
	}

	// Not words. A three-letter run that nobody would pay extra for must stay
	// in the hundred-thousand pool.
	for _, plain := range []string{"QXZ", "SDF", "MYN", "KLM"} {
		if LetterRarity(plain).Multiplier != 1 {
			t.Errorf("%s so'z tarifiga tushib qoldi", plain)
		}
	}

	// Three identical letters outrank a word, even when the word is one.
	if LetterRarity("WWW").Multiplier != 30 {
		t.Error("WWW uch bir xil harf sifatida baholanmadi")
	}
}
