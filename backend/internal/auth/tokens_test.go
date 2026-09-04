package auth

import (
	"encoding/base64"
	"testing"
)

func TestNewTokenIsUnguessable(t *testing.T) {
	token, hash, err := NewToken()
	if err != nil {
		t.Fatalf("token olinmadi: %v", err)
	}

	raw, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil {
		t.Fatalf("token base64url emas: %v", err)
	}
	if len(raw) != tokenBytes {
		t.Errorf("token %d bayt, kutilgani %d", len(raw), tokenBytes)
	}
	if len(hash) != 32 {
		t.Errorf("hash %d bayt, sha256 32 bo'lishi kerak", len(hash))
	}

	// The token is what goes in a URL and in an Authorization header. A
	// character either of those escapes turns into a support conversation.
	for _, c := range token {
		isSafe := (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ||
			(c >= '0' && c <= '9') || c == '-' || c == '_'
		if !isSafe {
			t.Errorf("tokenda URL uchun xavfli belgi: %q", c)
		}
	}
}

func TestTokensDoNotRepeat(t *testing.T) {
	// Not a test of the random source, which is the operating system's job.
	// A test that the source is actually being read each time — a constant, or
	// a seeded generator reused, would show up here immediately.
	const draws = 1000
	seen := make(map[string]struct{}, draws)

	for range draws {
		token, _, err := NewToken()
		if err != nil {
			t.Fatalf("token olinmadi: %v", err)
		}
		if _, repeat := seen[token]; repeat {
			t.Fatal("bir xil token ikki marta chiqdi")
		}
		seen[token] = struct{}{}
	}
}

func TestHashTokenIsStableAndOneWay(t *testing.T) {
	token, hash, err := NewToken()
	if err != nil {
		t.Fatalf("token olinmadi: %v", err)
	}

	// Looking a session up means hashing what was presented and matching it
	// against the stored column, so the same input must give the same bytes
	// every time or every session breaks on the request after it is issued.
	again := HashToken(token)
	if string(again) != string(hash) {
		t.Error("bir xil token ikki xil hash berdi")
	}

	// The whole point of storing the hash: it must not be the token.
	if string(hash) == token {
		t.Error("hash tokenning o'zi bo'lib chiqdi")
	}

	// One changed character has to change the answer, or a near-miss would be
	// accepted as a session.
	altered := []byte(token)
	if altered[0] == 'a' {
		altered[0] = 'b'
	} else {
		altered[0] = 'a'
	}
	if string(HashToken(string(altered))) == string(hash) {
		t.Error("o'zgargan token bir xil hash berdi")
	}
}
