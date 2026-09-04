package auth

import (
	"context"
	"testing"
)

// What a session does once it exists. The harness these use lives in
// signin_test.go, because a session cannot be made without signing in first.

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
