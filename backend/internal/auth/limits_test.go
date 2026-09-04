package auth

import (
	"context"
	"fmt"
	"net/netip"
	"strings"
	"testing"
	"time"
)

// What stops the sign-in form being used against somebody. The harness lives
// in signin_test.go.

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
		_, _ = service.pool.Exec(context.Background(), `delete from flex_login_tokens where ip = $1`, source)
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
