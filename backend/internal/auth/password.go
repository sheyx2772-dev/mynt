package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"golang.org/x/crypto/argon2"
)

// Hashing a password.
//
// Argon2id, and slow on purpose. A session token is 32 bytes from the operating
// system and there is nothing to guess; a password is a word somebody chose, so
// the only defence against guessing it offline is making each guess expensive.
//
// The parameters are stored in the string beside each hash, so raising them
// later does not invalidate what is already there — a password verified against
// old parameters can be rehashed with the new ones on the next sign-in.

const (
	// One pass over 64 MiB, on four threads. OWASP's current floor is 19 MiB;
	// this is above it because a panel signs in a handful of people a day and
	// can afford the tenth of a second.
	argonTime    = 1
	argonMemory  = 64 * 1024
	argonThreads = 4
	argonKeyLen  = 32
	argonSaltLen = 16
)

// Long enough that guessing is not a strategy, short enough that somebody will
// actually set one. Length is the only rule: a required symbol produces
// "Parol1!" and a rule against reuse produces a sticky note.
const MinPasswordLength = 10

var (
	ErrPasswordTooShort = fmt.Errorf("parol kamida %d ta belgidan iborat bo'lsin", MinPasswordLength)
	ErrBadPassword      = errors.New("email yoki parol noto'g'ri")
)

// HashPassword returns a PHC string carrying the parameters, salt and hash.
func HashPassword(password string) (string, error) {
	// Counted in characters rather than bytes: a ten-character Uzbek password
	// is more than ten bytes, and rejecting it would be counting the wrong
	// thing.
	if utf8.RuneCountInString(password) < MinPasswordLength {
		return "", ErrPasswordTooShort
	}

	salt := make([]byte, argonSaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	key := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)

	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, argonMemory, argonTime, argonThreads,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(key),
	), nil
}

// VerifyPassword checks a password against a stored hash.
//
// Reads the parameters out of the hash rather than assuming today's, so a hash
// made with older settings still verifies.
func VerifyPassword(password, encoded string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" {
		return false
	}

	var version int
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil || version != argon2.Version {
		return false
	}

	var memory uint32
	var time uint32
	var threads uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &time, &threads); err != nil {
		return false
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}
	want, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false
	}

	got := argon2.IDKey([]byte(password), salt, time, memory, threads, uint32(len(want)))

	// Constant time. A comparison that returns early tells somebody guessing
	// how much of their guess was right, one request at a time.
	return subtle.ConstantTimeCompare(got, want) == 1
}
