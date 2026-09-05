package auth

import (
	"context"
	"errors"
	"fmt"
	"net/netip"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Signing in with a phone number.
//
// The door this market uses. Every limit below has two reasons: a code sent to
// a number is a message somebody did not ask for, and it is a message we paid
// for — a script that can make us send a hundred of them has made somebody's
// evening unpleasant and sent us a bill for it.
const (
	// Short, because a six-digit code is guessable in a way a token is not.
	// What actually protects it is three attempts, enforced in SQL.
	PhoneCodeLifetime = 5 * time.Minute

	codesPerPhonePerHour = 3
	codesPerIPPerHour    = 10
	phoneWindow          = time.Hour
)

var (
	ErrBadPhone = errors.New("telefon raqam noto'g'ri")
	// ErrBadCode covers a wrong code, an expired one, one already used, and one
	// guessed at three times. Four facts, one message: telling them apart tells
	// somebody guessing which half of the guess was right.
	ErrBadCode = errors.New("kod noto'g'ri yoki eskirgan")
)

// RequestPhoneCode sends a code, if the caller is allowed one.
//
// Returns nil when the number is refused for rate limiting, and the caller
// answers the same way it answers success — the same reason the sign-in link
// does: a different answer is a way of asking whether a number has an account.
func (s *Service) RequestPhoneCode(ctx context.Context, rawPhone string, ip *netip.Addr) error {
	phone, _, ok := NormalisePhone(rawPhone)
	if !ok {
		return ErrBadPhone
	}

	allowed, err := s.withinPhoneLimit(ctx, phone, ip)
	if err != nil {
		return err
	}
	if !allowed {
		return nil
	}

	code, hash, err := NewPhoneCode()
	if err != nil {
		return err
	}

	if _, err := s.queries.CreatePhoneCode(ctx, store.CreatePhoneCodeParams{
		Phone:     phone,
		CodeHash:  hash,
		ExpiresAt: timestamp(time.Now().Add(PhoneCodeLifetime)),
		Ip:        ip,
	}); err != nil {
		return err
	}

	// No brand name and no link. A sign-in message that reads like an
	// advertisement is a sign-in message an operator filters, and a link in one
	// is what every phishing SMS in this country looks like.
	return s.sms.Send(ctx, phone, fmt.Sprintf("Flex: %s. Kod 5 daqiqa amal qiladi. Hech kimga aytmang.", code))
}

// VerifyPhoneCode spends a code and returns a session.
func (s *Service) VerifyPhoneCode(ctx context.Context, rawPhone, code, userAgent string, ip *netip.Addr) (string, Account, error) {
	phone, country, ok := NormalisePhone(rawPhone)
	if !ok {
		return "", Account{}, ErrBadPhone
	}

	// The update that reads the code also spends it, so two requests racing
	// with one code produce one session and one failure.
	if _, err := s.queries.ClaimPhoneCode(ctx, store.ClaimPhoneCodeParams{
		Phone: phone, CodeHash: HashToken(code),
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Counted before refusing, so three wrong guesses spend the code
			// rather than leaving it open for a fourth.
			_ = s.queries.RecordPhoneGuess(ctx, phone)
			return "", Account{}, ErrBadCode
		}
		return "", Account{}, err
	}

	account, err := s.accountForPhone(ctx, phone, country)
	if err != nil {
		return "", Account{}, err
	}

	owner, err := uuid.Parse(account.ID)
	if err != nil {
		return "", Account{}, err
	}

	token, err := s.issueSession(ctx, owner, userAgent, ip)
	return token, account, err
}

// accountForPhone finds the account a number belongs to, or makes one.
//
// Proving a number is what creates the account, in the same way following a
// link does — nothing exists for a number somebody only typed into a form.
func (s *Service) accountForPhone(ctx context.Context, phone, country string) (Account, error) {
	row, err := s.queries.AccountForPhone(ctx, phone)
	if err == nil {
		account := Account{ID: row.UserID.String(), Verified: true}
		if row.Email != nil {
			account.Email = *row.Email
		}
		return account, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return Account{}, err
	}

	// An account with no address. The directory wants one, so the number stands
	// in — a placeholder at a domain nobody can receive mail at, which is
	// honest: this person signed up by phone and has given us no address.
	//
	// The country goes on the row rather than being derived later, because this
	// is the moment we know it: dial codes are variable length, and working it
	// out from the digits afterwards needs a prefix table all over again.
	account, err := s.directory.FindOrCreate(ctx, phone+"@telefon.flex.com.uz")
	if err != nil {
		return Account{}, err
	}

	owner, err := uuid.Parse(account.ID)
	if err != nil {
		return Account{}, err
	}
	if err := s.queries.LinkPhone(ctx, store.LinkPhoneParams{
		Phone: phone, UserID: owner, Country: optionalText(country),
	}); err != nil {
		return Account{}, err
	}

	return account, nil
}

func (s *Service) withinPhoneLimit(ctx context.Context, phone string, ip *netip.Addr) (bool, error) {
	window := int32(phoneWindow.Seconds())

	byPhone, err := s.queries.CountRecentPhoneCodes(ctx, store.CountRecentPhoneCodesParams{
		Phone: phone, WindowSeconds: window,
	})
	if err != nil || byPhone >= codesPerPhonePerHour {
		return false, err
	}

	if ip == nil {
		return true, nil
	}

	bySource, err := s.queries.CountRecentPhoneCodesByIP(ctx, store.CountRecentPhoneCodesByIPParams{
		Ip: ip, WindowSeconds: window,
	})
	if err != nil {
		return false, err
	}
	return bySource < codesPerIPPerHour, nil
}

// optionalText stores an unrecognised country as null rather than as "", so a
// report counting customers by country is not asked to explain an empty string.
func optionalText(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
