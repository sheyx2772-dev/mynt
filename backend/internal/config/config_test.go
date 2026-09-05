package config

import "testing"

// The list decides who can give away numbers worth millions, so the two ways
// it can be wrong both matter: letting the wrong person in, and locking
// everybody out because of a space after a comma.
func TestIsAdmin(t *testing.T) {
	cfg := Config{AdminEmails: readList(" aziz@flex.uz, DILSHOD@flex.uz ")}

	for _, allowed := range []string{"aziz@flex.uz", "Aziz@Flex.uz", "dilshod@flex.uz"} {
		if !cfg.IsAdmin(allowed) {
			t.Errorf("%q kiritilmadi", allowed)
		}
	}

	for _, refused := range []string{
		"", "begona@example.com",
		// Not a prefix or suffix match: a lookalike address must not pass.
		"aziz@flex.uz.evil.com", "notaziz@flex.uz", "aziz@flex.u",
	} {
		if cfg.IsAdmin(refused) {
			t.Errorf("%q kiritildi", refused)
		}
	}
}

// A deployment that forgot the variable has no admin rather than an open one.
func TestNobodyIsAdminByDefault(t *testing.T) {
	var cfg Config
	for _, email := range []string{"", "aziz@flex.uz", "anyone@anywhere"} {
		if cfg.IsAdmin(email) {
			t.Errorf("ro'yxat bo'sh, lekin %q kiritildi", email)
		}
	}
}

// A field can be declared, used, and never filled in. This one was: `IsAdmin`
// read `AdminEmails`, and nothing put anything in it, so the panel was shut to
// everybody including the person who set the variable. It failed closed, which
// is why it took a working deployment to notice — so the reading of every
// setting is asserted here rather than only its shape.
func TestLoadReadsTheEnvironment(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://x/y")
	t.Setenv("APP_ENV", "development")
	t.Setenv("ADMIN_EMAILS", "aziz@flex.uz, dilshod@flex.uz")
	t.Setenv("SITE_URL", "https://example.uz/")
	t.Setenv("PAYME_MERCHANT_ID", "merchant-1")
	t.Setenv("CLICK_SERVICE_ID", "99108")
	t.Setenv("CLICK_MERCHANT_ID", "click-1")
	t.Setenv("TRUST_PROXY", "true")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("sozlama o'qilmadi: %v", err)
	}

	if len(cfg.AdminEmails) != 2 || !cfg.IsAdmin("dilshod@flex.uz") {
		t.Errorf("admin ro'yxati: %v", cfg.AdminEmails)
	}
	// The trailing slash goes, or every link built from it has two.
	if cfg.SiteURL != "https://example.uz" {
		t.Errorf("sayt manzili %q", cfg.SiteURL)
	}
	if cfg.PaymeMerchantID != "merchant-1" || cfg.ClickServiceID != "99108" || cfg.ClickMerchantID != "click-1" {
		t.Error("to'lov identifikatorlari o'qilmadi")
	}
	if !cfg.TrustProxy {
		t.Error("TRUST_PROXY o'qilmadi")
	}
	if !cfg.IsDevelopment() {
		t.Error("APP_ENV o'qilmadi")
	}
}

// The one route that will print a sign-in code checks this, so a wrong answer
// here is a code on a screen in production.
func TestSMSConfiguredNeedsBothHalves(t *testing.T) {
	cases := []struct {
		email, password string
		want            bool
	}{
		{"", "", false},
		{"a@b.uz", "", false},
		{"", "hunter2", false},
		{"a@b.uz", "hunter2", true},
	}
	for _, c := range cases {
		got := Config{EskizEmail: c.email, EskizPassword: c.password}.SMSConfigured()
		if got != c.want {
			t.Errorf("SMSConfigured(email=%q, password set=%t) = %t, want %t",
				c.email, c.password != "", got, c.want)
		}
	}
}
