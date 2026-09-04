// Package auth issues and checks the two secrets this system hands out: a
// sign-in link that lasts fifteen minutes, and a session that lasts a month.
//
// Both are the same shape — 32 bytes from the operating system's random
// source, given to the client as base64, and kept here only as a SHA-256 of
// those bytes. Nothing in the database can be replayed as a credential.
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
)

// 32 bytes. Long enough that guessing is not a strategy — there are 2^256 of
// them — and short enough to sit in a URL without wrapping in a mail client.
const tokenBytes = 32

// NewToken returns a fresh secret and the hash to store for it.
//
// The plaintext is returned once, to be handed to the client, and is never
// written anywhere. Losing it means the client has to ask for another.
func NewToken() (token string, hash []byte, err error) {
	raw := make([]byte, tokenBytes)
	if _, err := rand.Read(raw); err != nil {
		// crypto/rand failing means the system has no entropy source, which is
		// not a condition to carry on through with a weaker token.
		return "", nil, fmt.Errorf("tasodifiy qiymat olinmadi: %w", err)
	}

	// Raw URL encoding: no padding and no characters a URL would escape, so
	// the token survives being pasted, copied out of a mail client and typed.
	token = base64.RawURLEncoding.EncodeToString(raw)
	return token, HashToken(token), nil
}

// HashToken is how a presented token is turned into something to look up.
//
// Plain SHA-256, with no salt and no work factor, and both omissions are
// deliberate. A salt defends against one hash being attacked for many inputs;
// there is one input here and it is unique. A work factor defends against
// guessing; the input is 256 bits of entropy rather than a word somebody
// chose, so there is nothing to guess. Making this slow would only make every
// authenticated request slow.
func HashToken(token string) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}
