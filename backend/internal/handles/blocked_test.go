package handles

import (
	"crypto/sha256"
	"encoding/hex"
	"sort"
	"strings"
	"testing"
)

// Nothing may be both refused and priced. A word in both lists is a word whose
// behaviour depends on which check runs first, which is the kind of thing that
// works until somebody reorders two lines.
func TestBlockedAndRareDoNotOverlap(t *testing.T) {
	for word := range blockedWords {
		if rareWords[word] {
			t.Errorf("%s ikkala ro'yxatda ham bor", word)
		}
	}
}

// A blocked combination is not part of the namespace at all: the search, the
// purchase, the profile page and the panel all go through Parse, so refusing
// it here is refusing it everywhere.
func TestParseRefusesBlocked(t *testing.T) {
	for _, raw := range []string{"SEX777", "xxx001", " MVD000 ", "Gay123"} {
		if _, ok := Parse(raw); ok {
			t.Errorf("%q qabul qilindi, rad etilishi kerak edi", raw)
		}
	}

	// And nothing else moved. A blocklist that quietly takes an ordinary
	// combination with it is worse than none.
	for _, raw := range []string{"AAA777", "QXD483", "OSH001", "GYM555"} {
		if _, ok := Parse(raw); !ok {
			t.Errorf("%q rad etildi, qabul qilinishi kerak edi", raw)
		}
	}
}

// The count the site prints has to be the count that can be bought.
func TestNamespaceExcludesBlocked(t *testing.T) {
	want := 26*26*26*10*10*10 - len(blockedWords)*1000
	if Namespace != want {
		t.Errorf("Namespace = %d, kutilgani %d", Namespace, want)
	}
}

// Both lists live twice: here, and in landing/src/lib/pricing.ts, which the
// price calculator needs because it runs in the browser and cannot wait for a
// round trip per keystroke.
//
// Two copies of a pricing rule is two prices. These fingerprints are how the
// copies are held together: the same two lines exist in pricing.test.ts, and
// editing either list without editing the other fails on one side or the
// other with the name of the file to go and fix.
func TestListsMatchTheWebsite(t *testing.T) {
	if got := fingerprint(rareWords); got != "3e1d5999" {
		t.Errorf("rareWords o'zgardi: %s\n"+
			"landing/src/lib/pricing.ts dagi RARE_WORDS ni ham yangilang, "+
			"so'ng ikkala testdagi barmoq izini almashtiring", got)
	}
	if got := fingerprint(topWords); got != "5b56180a" {
		t.Errorf("topWords o'zgardi: %s\n"+
			"landing va old-landing dagi TOP_WORDS ni ham yangilang, "+
			"so'ng uchala testdagi barmoq izini almashtiring", got)
	}
	if got := fingerprint(blockedWords); got != "542778ed" {
		t.Errorf("blockedWords o'zgardi: %s\n"+
			"landing/src/lib/pricing.ts dagi BLOCKED_WORDS ni ham yangilang, "+
			"so'ng ikkala testdagi barmoq izini almashtiring", got)
	}
}

func fingerprint(words map[string]bool) string {
	sorted := make([]string, 0, len(words))
	for word := range words {
		sorted = append(sorted, word)
	}
	sort.Strings(sorted)

	sum := sha256.Sum256([]byte(strings.Join(sorted, ",")))
	return hex.EncodeToString(sum[:])[:8]
}
