package handles

import (
	"strings"
	"testing"
)

func TestAProfileNeedsAName(t *testing.T) {
	if _, problem := ReadProfile(ProfileInput{}, PlanFree); problem == "" {
		t.Error("ismsiz profil qabul qilindi")
	}
	if _, problem := ReadProfile(ProfileInput{Name: "   "}, PlanFree); problem == "" {
		t.Error("faqat bo'shliqdan iborat ism qabul qilindi")
	}
	if _, problem := ReadProfile(ProfileInput{Name: "Aziz"}, PlanFree); problem != "" {
		t.Errorf("to'g'ri profil rad etildi: %s", problem)
	}
}

func TestTextIsCutByCharacterNotByByte(t *testing.T) {
	// Uzbek is written with multi-byte characters. A byte-wise cut lands in the
	// middle of one, which stores invalid UTF-8 and renders as a black diamond.
	long := strings.Repeat("ў", 300)

	profile, problem := ReadProfile(ProfileInput{Name: "Aziz", Bio: long}, PlanFree)
	if problem != "" {
		t.Fatalf("rad etildi: %s", problem)
	}
	if got := len([]rune(profile.Bio)); got != 280 {
		t.Errorf("bio %d ta belgi, chegara 280", got)
	}
	if !isValidUTF8(profile.Bio) {
		t.Error("kesilgan matn buzuq UTF-8 bo'lib qoldi")
	}
}

func isValidUTF8(s string) bool {
	for _, r := range s {
		if r == '�' {
			return false
		}
	}
	return true
}

func TestAnAddressThatIsNotOneIsDroppedRatherThanShown(t *testing.T) {
	profile, _ := ReadProfile(ProfileInput{
		Name:         "Aziz",
		ContactEmail: "salom",
		Phone:        "yo'q",
	}, PlanFree)

	// Both are rendered publicly — one as a mailto:, one as something a phone
	// dials — so a value that is not one is removed rather than displayed.
	if profile.ContactEmail != "" {
		t.Errorf("email %q saqlanib qoldi", profile.ContactEmail)
	}
	if profile.Phone != "" {
		t.Errorf("telefon %q saqlanib qoldi", profile.Phone)
	}
}

func TestTheServiceLimitComesFromThePlanAndNotFromTheRequest(t *testing.T) {
	many := make([]Service, 12)
	for i := range many {
		many[i] = Service{Name: "Xizmat", Price: "100 000"}
	}

	free, _ := ReadProfile(ProfileInput{Name: "Aziz", Services: many}, PlanFree)
	if len(free.Services) != ServiceLimit(PlanFree) {
		t.Errorf("bepul tarifda %d ta xizmat, chegara %d", len(free.Services), ServiceLimit(PlanFree))
	}

	premium, _ := ReadProfile(ProfileInput{Name: "Aziz", Services: many}, PlanPremium)
	if len(premium.Services) != ServiceLimit(PlanPremium) {
		t.Errorf("premium tarifda %d ta xizmat, chegara %d", len(premium.Services), ServiceLimit(PlanPremium))
	}

	// A plan nobody sells falls back to the free limit rather than to no limit.
	invented, _ := ReadProfile(ProfileInput{Name: "Aziz", Services: many}, "cheksiz")
	if len(invented.Services) != ServiceLimit(PlanFree) {
		t.Errorf("noma'lum tarif %d ta xizmat berdi", len(invented.Services))
	}
}

func TestADesignTheRendererCannotDrawFallsBack(t *testing.T) {
	profile, _ := ReadProfile(ProfileInput{Name: "Aziz", CardDesign: "oltin", DeviceType: "soat"}, PlanFree)

	// A stored value the site cannot draw would be a blank card and an object
	// that does not exist.
	if profile.CardDesign != DefaultCardDesign {
		t.Errorf("dizayn %q bo'lib qoldi", profile.CardDesign)
	}
	if profile.DeviceType != DefaultDeviceType {
		t.Errorf("qurilma %q bo'lib qoldi", profile.DeviceType)
	}
}

func TestTagsAreReducedToWhatCanBeRenderedAndSearched(t *testing.T) {
	cases := map[string][]string{
		"#startup, #dizayn":         {"startup", "dizayn"},
		"sartarosh  chilonzor":      {"sartarosh", "chilonzor"},
		"<script>alert(1)</script>": {"scriptalert1script"},
		"bir,bir,bir":               {"bir"},
		"a,b,c,d,e,f,g,h":           {"a", "b", "c", "d", "e"},
		"":                          {},
		",,,  ,":                    {},
	}

	for input, want := range cases {
		got := ParseTags(input)
		if len(got) != len(want) {
			t.Errorf("%q → %v, kutilgani %v", input, got, want)
			continue
		}
		for i := range want {
			if got[i] != want[i] {
				t.Errorf("%q → %v, kutilgani %v", input, got, want)
				break
			}
		}
	}
}

func TestTagsKeepUzbekLetters(t *testing.T) {
	// The reduction is to letters and digits, not to ASCII. A tag somebody
	// would actually write has to survive it.
	got := ParseTags("#tarjimon #o'qituvchi #дизайн")
	if len(got) == 0 || got[0] != "tarjimon" {
		t.Fatalf("→ %v", got)
	}
	// The apostrophe goes, the letters stay.
	if got[1] != "oqituvchi" {
		t.Errorf("o'qituvchi → %q", got[1])
	}
	if got[2] != "дизайн" {
		t.Errorf("kirill harflar yo'qoldi: %q", got[2])
	}
}
