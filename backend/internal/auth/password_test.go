package auth

import (
	"strings"
	"testing"
)

func TestAPasswordVerifiesAgainstItsOwnHash(t *testing.T) {
	const password = "juda-uzun-parol"

	encoded, err := HashPassword(password)
	if err != nil {
		t.Fatalf("hash olinmadi: %v", err)
	}
	if !strings.HasPrefix(encoded, "$argon2id$") {
		t.Errorf("PHC satri emas: %q", encoded)
	}
	if strings.Contains(encoded, password) {
		t.Error("parolning o'zi hashda saqlanib qoldi")
	}

	if !VerifyPassword(password, encoded) {
		t.Error("to'g'ri parol rad etildi")
	}
	if VerifyPassword(password+"x", encoded) {
		t.Error("noto'g'ri parol qabul qilindi")
	}
}

func TestTheSamePasswordHashesDifferentlyEveryTime(t *testing.T) {
	// A salt per hash. Without one, two people with the same password have the
	// same row, and one cracked hash is two accounts.
	first, _ := HashPassword("juda-uzun-parol")
	second, _ := HashPassword("juda-uzun-parol")

	if first == second {
		t.Fatal("bir xil parol bir xil hash berdi — tuz yo'q")
	}
	if !VerifyPassword("juda-uzun-parol", first) || !VerifyPassword("juda-uzun-parol", second) {
		t.Error("ikkalasi ham tekshiruvdan o'tishi kerak edi")
	}
}

func TestLengthIsCountedInCharactersNotBytes(t *testing.T) {
	// Ten Uzbek characters is more than ten bytes. Counting bytes would accept
	// a shorter password than the rule says and reject a valid one.
	if _, err := HashPassword("qisqa"); err != ErrPasswordTooShort {
		t.Errorf("qisqa parol qabul qilindi: %v", err)
	}
	if _, err := HashPassword("o'zbekcha1"); err != nil {
		t.Errorf("10 belgili parol rad etildi: %v", err)
	}
}

func TestAHashThatIsNotOneIsRefused(t *testing.T) {
	// Anything that reached this column and is not a hash we wrote must fail
	// closed rather than throwing or, worse, matching.
	for _, bad := range []string{
		"", "parol", "$argon2i$v=19$m=65536,t=1,p=4$c2FsdA$aGFzaA",
		"$argon2id$v=99$m=65536,t=1,p=4$c2FsdA$aGFzaA",
		"$argon2id$v=19$broken$c2FsdA$aGFzaA",
		"$argon2id$v=19$m=65536,t=1,p=4$!!!$aGFzaA",
		"$argon2id$v=19$m=65536,t=1,p=4$c2FsdA",
	} {
		if VerifyPassword("juda-uzun-parol", bad) {
			t.Errorf("%q qabul qilindi", bad)
		}
	}
}
