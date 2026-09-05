package auth

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"
)

// The phone door, against a real database — because most of what protects it is
// what the database does: three attempts spend a code, and one statement both
// reads and spends it.

func newPhoneService(t *testing.T) (*Service, *capturedSMS, string) {
	t.Helper()

	pool := testPool(t)
	texter := &capturedSMS{}
	// A number nobody else is using, so the suite can run twice without
	// tripping its own rate limits.
	phone := fmt.Sprintf("99890%07d", time.Now().UnixNano()%10_000_000)

	t.Cleanup(func() {
		ctx := context.Background()
		_, _ = pool.Exec(ctx, `delete from flex_phone_codes where phone = $1`, phone)
		_, _ = pool.Exec(ctx, `delete from auth.users where id in (select user_id from flex_phones where phone = $1)`, phone)
		_, _ = pool.Exec(ctx, `delete from flex_phones where phone = $1`, phone)
	})

	service := NewService(pool, &capturedMail{}, texter, &fakeDirectory{pool: pool}, "http://localhost:3000")
	return service, texter, phone
}

func codeFrom(t *testing.T, texter *capturedSMS) string {
	t.Helper()
	if len(texter.sent) == 0 {
		t.Fatal("SMS yuborilmadi")
	}
	text := texter.sent[len(texter.sent)-1].text
	// "Flex: 123456. Kod 5 daqiqa…"
	_, after, found := strings.Cut(text, ": ")
	if !found {
		t.Fatalf("xabarda kod yo'q: %q", text)
	}
	code, _, _ := strings.Cut(after, ".")
	return code
}

func TestAPhoneCodeSignsSomebodyIn(t *testing.T) {
	service, texter, phone := newPhoneService(t)
	ctx := context.Background()

	if err := service.RequestPhoneCode(ctx, phone, nil); err != nil {
		t.Fatalf("kod yuborilmadi: %v", err)
	}

	token, account, err := service.VerifyPhoneCode(ctx, phone, codeFrom(t, texter), "test", nil)
	if err != nil {
		t.Fatalf("kod tekshirilmadi: %v", err)
	}
	if token == "" || account.ID == "" {
		t.Fatal("sessiya berilmadi")
	}

	// And the session works on the next request.
	if _, err := service.Authenticate(ctx, token); err != nil {
		t.Errorf("sessiya tanilmadi: %v", err)
	}
}

func TestTheSameNumberIsTheSameAccountHoweverItIsTyped(t *testing.T) {
	service, texter, phone := newPhoneService(t)
	ctx := context.Background()

	_ = service.RequestPhoneCode(ctx, phone, nil)
	_, first, err := service.VerifyPhoneCode(ctx, phone, codeFrom(t, texter), "test", nil)
	if err != nil {
		t.Fatalf("birinchi kirish: %v", err)
	}

	// Typed the way somebody actually writes it on a card.
	local := "+" + phone[:3] + " " + phone[3:5] + " " + phone[5:8] + " " + phone[8:10] + " " + phone[10:]
	_ = service.RequestPhoneCode(ctx, local, nil)
	_, second, err := service.VerifyPhoneCode(ctx, local, codeFrom(t, texter), "test", nil)
	if err != nil {
		t.Fatalf("ikkinchi kirish: %v", err)
	}

	if first.ID != second.ID {
		t.Errorf("bir raqam ikki hisob berdi: %s va %s", first.ID, second.ID)
	}
}

func TestACodeIsSpentOnce(t *testing.T) {
	service, texter, phone := newPhoneService(t)
	ctx := context.Background()

	_ = service.RequestPhoneCode(ctx, phone, nil)
	code := codeFrom(t, texter)

	if _, _, err := service.VerifyPhoneCode(ctx, phone, code, "test", nil); err != nil {
		t.Fatalf("birinchi urinish: %v", err)
	}
	// An SMS sits on a lock screen for as long as the phone does.
	if _, _, err := service.VerifyPhoneCode(ctx, phone, code, "test", nil); err != ErrBadCode {
		t.Errorf("ikkinchi urinish %v qaytardi", err)
	}
}

func TestThreeWrongGuessesSpendTheCode(t *testing.T) {
	service, texter, phone := newPhoneService(t)
	ctx := context.Background()

	_ = service.RequestPhoneCode(ctx, phone, nil)
	code := codeFrom(t, texter)

	// Six digits is a million possibilities, which is not many. Three attempts
	// is what makes that safe, and it is enforced in SQL rather than here.
	for range 3 {
		if _, _, err := service.VerifyPhoneCode(ctx, phone, "000000", "test", nil); err != ErrBadCode {
			t.Fatalf("noto'g'ri kod qabul qilindi: %v", err)
		}
	}

	if _, _, err := service.VerifyPhoneCode(ctx, phone, code, "test", nil); err != ErrBadCode {
		t.Error("uchta xatodan keyin to'g'ri kod hali ham ishladi")
	}
}

func TestTooManyCodesStopSendingWithoutSayingSo(t *testing.T) {
	service, texter, phone := newPhoneService(t)
	ctx := context.Background()

	for i := range codesPerPhonePerHour + 3 {
		// Silent, for the same reason the link is: a different answer is a way
		// of asking whether a number has an account. And every message past the
		// limit is one we would have paid for.
		if err := service.RequestPhoneCode(ctx, phone, nil); err != nil {
			t.Fatalf("%d-urinish xato qaytardi: %v", i+1, err)
		}
	}

	if len(texter.sent) != codesPerPhonePerHour {
		t.Errorf("%d ta SMS yuborildi, chegara %d", len(texter.sent), codesPerPhonePerHour)
	}
}

func TestTheMessageCarriesNoLink(t *testing.T) {
	service, texter, phone := newPhoneService(t)

	if err := service.RequestPhoneCode(context.Background(), phone, nil); err != nil {
		t.Fatalf("kod yuborilmadi: %v", err)
	}

	text := texter.sent[0].text
	// Every phishing SMS in this country carries a link. A sign-in message that
	// does teaches people the wrong lesson, and an operator filters it.
	for _, forbidden := range []string{"http", "://", ".com", ".uz/"} {
		if strings.Contains(text, forbidden) {
			t.Errorf("xabarda %q bor: %q", forbidden, text)
		}
	}
}
