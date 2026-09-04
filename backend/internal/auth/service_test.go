package auth

import (
	"context"
	"fmt"
	"net/netip"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/mail"
)

// These run against a real Postgres, because what is being tested is mostly
// what the database does: a single-use link is single-use because one statement
// both reads and spends it, and no amount of Go proves that.
//
// `make test` points TEST_DATABASE_URL at the development database. Without it
// they skip, so `go test ./...` on a machine with no Docker still passes.

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()

	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL yo'q — bazaga tegadigan testlar o'tkazib yuborildi")
	}

	pool, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("bazaga ulanilmadi: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		t.Fatalf("baza javob bermadi: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// A collector rather than a sender: the tests need to read the link that would
// have been mailed, which is the only way to get a token out of the service —
// exactly as it is for a real person.
type capturedMail struct{ messages []mail.Message }

func (c *capturedMail) Send(_ context.Context, msg mail.Message) error {
	c.messages = append(c.messages, msg)
	return nil
}

func (c *capturedMail) lastToken(t *testing.T) string {
	t.Helper()
	if len(c.messages) == 0 {
		t.Fatal("xat yuborilmadi")
	}
	body := c.messages[len(c.messages)-1].Body
	_, after, found := strings.Cut(body, "?t=")
	if !found {
		t.Fatalf("xatda havola yo'q: %q", body)
	}
	token, _, _ := strings.Cut(after, "\n")
	return strings.TrimSpace(token)
}

// Every test gets an address nobody else is using, and takes its rows away
// afterwards, so the suite can run twice without tripping its own rate limits.
func newService(t *testing.T) (*Service, *capturedMail, string) {
	t.Helper()

	pool := testPool(t)
	mailer := &capturedMail{}
	email := fmt.Sprintf("test-%d@example.com", time.Now().UnixNano())

	t.Cleanup(func() {
		ctx := context.Background()
		_, _ = pool.Exec(ctx, `delete from login_tokens where email = $1`, email)
		_, _ = pool.Exec(ctx, `delete from users where email = $1`, email)
	})

	return NewService(pool, mailer, "http://localhost:3000"), mailer, email
}

func TestSignInCreatesAnAccountAndASession(t *testing.T) {
	service, mailer, email := newService(t)
	ctx := context.Background()

	if err := service.RequestLink(ctx, email, nil); err != nil {
		t.Fatalf("havola so'ralmadi: %v", err)
	}

	sessionToken, account, err := service.ConsumeLink(ctx, mailer.lastToken(t), "test", nil)
	if err != nil {
		t.Fatalf("havola sarflanmadi: %v", err)
	}
	if account.Email != email {
		t.Errorf("hisob %q, kutilgani %q", account.Email, email)
	}
	// Following a link is what proves the address; nothing else does.
	if !account.Verified {
		t.Error("havolani ochgan hisob tasdiqlanmagan bo'lib qoldi")
	}

	// And the session it issued has to work on the next request.
	same, err := service.Authenticate(ctx, sessionToken)
	if err != nil {
		t.Fatalf("sessiya tanilmadi: %v", err)
	}
	if same.ID != account.ID {
		t.Error("sessiya boshqa hisobni ko'rsatdi")
	}
}

func TestAddressIsNormalisedBeforeItBecomesAnAccount(t *testing.T) {
	service, mailer, email := newService(t)
	ctx := context.Background()

	// Somebody typing their address with a capital letter is the same person.
	// Without this, one address becomes two accounts holding different handles.
	if err := service.RequestLink(ctx, strings.ToUpper(email), nil); err != nil {
		t.Fatalf("havola so'ralmadi: %v", err)
	}

	_, account, err := service.ConsumeLink(ctx, mailer.lastToken(t), "test", nil)
	if err != nil {
		t.Fatalf("havola sarflanmadi: %v", err)
	}
	if account.Email != email {
		t.Errorf("hisob %q bo'ldi, kichik harfda %q bo'lishi kerak edi", account.Email, email)
	}
}

func TestALinkIsSpentOnce(t *testing.T) {
	service, mailer, email := newService(t)
	ctx := context.Background()

	if err := service.RequestLink(ctx, email, nil); err != nil {
		t.Fatalf("havola so'ralmadi: %v", err)
	}
	token := mailer.lastToken(t)

	if _, _, err := service.ConsumeLink(ctx, token, "test", nil); err != nil {
		t.Fatalf("birinchi urinish yiqildi: %v", err)
	}

	// A sign-in link sits in a mailbox for as long as the mailbox exists, and
	// mailboxes are forwarded, shared and scanned. Once used, it is dead.
	if _, _, err := service.ConsumeLink(ctx, token, "test", nil); err != ErrBadToken {
		t.Errorf("ikkinchi urinish %v qaytardi, ErrBadToken kutilgandi", err)
	}
}

func TestAnExpiredLinkIsRefused(t *testing.T) {
	service, mailer, email := newService(t)
	ctx := context.Background()

	if err := service.RequestLink(ctx, email, nil); err != nil {
		t.Fatalf("havola so'ralmadi: %v", err)
	}
	token := mailer.lastToken(t)

	// Moved into the past rather than waiting a quarter of an hour.
	if _, err := service.pool.Exec(ctx,
		`update login_tokens set expires_at = now() - interval '1 minute' where email = $1`,
		email,
	); err != nil {
		t.Fatalf("muddat o'zgartirilmadi: %v", err)
	}

	if _, _, err := service.ConsumeLink(ctx, token, "test", nil); err != ErrBadToken {
		t.Errorf("eskirgan havola %v qaytardi, ErrBadToken kutilgandi", err)
	}
}

func TestAnInventedTokenIsRefused(t *testing.T) {
	service, _, _ := newService(t)

	if _, _, err := service.ConsumeLink(context.Background(), "buTokenHechQachonBerilmagan", "test", nil); err != ErrBadToken {
		t.Errorf("soxta token %v qaytardi, ErrBadToken kutilgandi", err)
	}
}

func TestSigningOutEndsThatSessionOnly(t *testing.T) {
	service, mailer, email := newService(t)
	ctx := context.Background()

	// Two sessions for one account: a phone and a laptop.
	sessions := make([]string, 0, 2)
	for range 2 {
		if err := service.RequestLink(ctx, email, nil); err != nil {
			t.Fatalf("havola so'ralmadi: %v", err)
		}
		token, _, err := service.ConsumeLink(ctx, mailer.lastToken(t), "test", nil)
		if err != nil {
			t.Fatalf("havola sarflanmadi: %v", err)
		}
		sessions = append(sessions, token)
	}

	if err := service.SignOut(ctx, sessions[0]); err != nil {
		t.Fatalf("chiqib bo'lmadi: %v", err)
	}

	if _, err := service.Authenticate(ctx, sessions[0]); err != ErrNoSession {
		t.Errorf("chiqilgan sessiya hali ham tanilyapti: %v", err)
	}
	// Signing out of a phone must not sign somebody out of their laptop.
	if _, err := service.Authenticate(ctx, sessions[1]); err != nil {
		t.Errorf("boshqa qurilmadagi sessiya ham o'chdi: %v", err)
	}
}

func TestAnExpiredSessionStopsWorking(t *testing.T) {
	service, mailer, email := newService(t)
	ctx := context.Background()

	if err := service.RequestLink(ctx, email, nil); err != nil {
		t.Fatalf("havola so'ralmadi: %v", err)
	}
	token, account, err := service.ConsumeLink(ctx, mailer.lastToken(t), "test", nil)
	if err != nil {
		t.Fatalf("havola sarflanmadi: %v", err)
	}

	// Expiry is decided by the statement, not by Go. This is the test of that.
	if _, err := service.pool.Exec(ctx,
		`update sessions set expires_at = now() - interval '1 second' where user_id = $1`,
		account.ID,
	); err != nil {
		t.Fatalf("muddat o'zgartirilmadi: %v", err)
	}

	if _, err := service.Authenticate(ctx, token); err != ErrNoSession {
		t.Errorf("eskirgan sessiya %v qaytardi, ErrNoSession kutilgandi", err)
	}
}

func TestTooManyRequestsStopSendingWithoutSayingSo(t *testing.T) {
	service, mailer, email := newService(t)
	ctx := context.Background()

	for i := range linksPerEmailPerHour + 3 {
		// The refusal is deliberately silent. An endpoint that answers "too
		// many attempts for this address" differently from "sent" is an
		// endpoint that answers whether an address has an account here.
		if err := service.RequestLink(ctx, email, nil); err != nil {
			t.Fatalf("%d-urinish xato qaytardi: %v", i+1, err)
		}
	}

	if len(mailer.messages) != linksPerEmailPerHour {
		t.Errorf("%d ta xat yuborildi, chegara %d edi", len(mailer.messages), linksPerEmailPerHour)
	}
}

func TestAddressesThatAreNotAddressesAreRefused(t *testing.T) {
	service, _, _ := newService(t)
	ctx := context.Background()

	for _, bad := range []string{"", "salom", "a@b", "@example.com", "aziz@", "aziz example@x.uz", strings.Repeat("a", 250) + "@example.com"} {
		if err := service.RequestLink(ctx, bad, nil); err != ErrInvalidEmail {
			t.Errorf("%q uchun %v qaytdi, ErrInvalidEmail kutilgandi", bad, err)
		}
	}
}

func TestTheSourceAddressIsRateLimitedSeparately(t *testing.T) {
	service, mailer, _ := newService(t)
	ctx := context.Background()

	source := netip.MustParseAddr("203.0.113.42")
	t.Cleanup(func() {
		_, _ = service.pool.Exec(context.Background(), `delete from login_tokens where ip = $1`, source)
	})

	// Every request from one place, each naming a different address — a script
	// working through a list, which the per-address window cannot see.
	for i := range linksPerIPPerHour + 5 {
		address := fmt.Sprintf("scan-%d-%d@example.com", time.Now().UnixNano(), i)
		if err := service.RequestLink(ctx, address, &source); err != nil {
			t.Fatalf("%d-urinish xato qaytardi: %v", i+1, err)
		}
	}

	if len(mailer.messages) != linksPerIPPerHour {
		t.Errorf("%d ta xat yuborildi, manba chegarasi %d edi", len(mailer.messages), linksPerIPPerHour)
	}
}
