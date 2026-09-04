package leads

import (
	"strings"
	"testing"
)

// This is the one form anybody on the internet can post to, on behalf of a
// profile they do not own. Every case here is something that arrives at it.

func TestAContactNeedsAWayToAnswerIt(t *testing.T) {
	if _, problem := Read(Input{Name: "Dilshod"}); problem == "" {
		t.Error("aloqasiz vizitka qabul qilindi")
	}
	// Different message: somebody who typed nothing needs to be told what to
	// type, and somebody who typed something needs to be told it was refused.
	_, blank := Read(Input{Name: "Dilshod"})
	_, wrong := Read(Input{Name: "Dilshod", Phone: "salom"})
	if blank == wrong {
		t.Errorf("bo'sh va noto'g'ri uchun bir xil xabar: %q", blank)
	}
}

func TestAContactNeedsAName(t *testing.T) {
	if _, problem := Read(Input{Phone: "+998901234567"}); problem == "" {
		t.Error("ismsiz vizitka qabul qilindi")
	}
	if _, problem := Read(Input{Name: "  ", Phone: "+998901234567"}); problem == "" {
		t.Error("bo'shliqdan iborat ism qabul qilindi")
	}
}

func TestOnlyTheSourcesWeIssueAreKept(t *testing.T) {
	// The marker sits in a URL anybody can edit. An owner's breakdown should
	// not be whatever a passer-by decided to type into it.
	for _, ours := range []string{"nfc", "qr", "share"} {
		checked, _ := Read(Input{Name: "Dilshod", Phone: "+998901234567", Source: ours})
		if checked.Source != ours {
			t.Errorf("%q yo'qoldi", ours)
		}
	}
	for _, theirs := range []string{"reklama", "<script>", "nfc'", "NFC", ""} {
		checked, _ := Read(Input{Name: "Dilshod", Phone: "+998901234567", Source: theirs})
		if checked.Source != "" {
			t.Errorf("%q saqlanib qoldi", theirs)
		}
	}
}

func TestSomethingThatIsNotAPhoneIsNotStoredAsOne(t *testing.T) {
	// A phone is rendered as something to dial and an address as a mailto:, so
	// a value that is neither is dropped rather than shown to the owner as one.
	checked, problem := Read(Input{Name: "Dilshod", Phone: "salom", Email: "dilshod@example.com"})
	if problem != "" {
		t.Fatalf("rad etildi: %s", problem)
	}
	if checked.Phone != "" {
		t.Errorf("telefon %q saqlanib qoldi", checked.Phone)
	}
	if checked.Email != "dilshod@example.com" {
		t.Errorf("email yo'qoldi: %q", checked.Email)
	}
}

func TestAnAddressIsStoredInOneCase(t *testing.T) {
	checked, _ := Read(Input{Name: "Dilshod", Email: "Dilshod@Example.COM"})
	if checked.Email != "dilshod@example.com" {
		t.Errorf("email %q", checked.Email)
	}
}

func TestLongTextIsCutByCharacterNotByByte(t *testing.T) {
	checked, problem := Read(Input{
		Name:  "Dilshod",
		Phone: "+998901234567",
		Note:  strings.Repeat("ў", 900),
	})
	if problem != "" {
		t.Fatalf("rad etildi: %s", problem)
	}
	if got := len([]rune(checked.Note)); got != 500 {
		t.Errorf("izoh %d ta belgi, chegara 500", got)
	}
	for _, r := range checked.Note {
		if r == '�' {
			t.Fatal("kesilgan matn buzuq UTF-8 bo'lib qoldi")
		}
	}
}
