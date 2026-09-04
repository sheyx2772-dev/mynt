package auth

import (
	"context"
	"fmt"
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
