// Package config reads what the process needs from its environment, once, at
// start-up.
//
// Nothing else in the backend reads an environment variable. A value that is
// missing or malformed stops the process here, at boot, with a sentence saying
// which one — rather than surfacing as a nil pointer inside a request handler
// at three in the morning. A server that cannot do its job should refuse to
// start rather than start and refuse its callers.
package config

import (
	"fmt"
	"os"
	"strings"
	"time"
)

type Config struct {
	// Where Postgres is. Required: there is no useful degraded mode for a
	// backend whose only job is to answer questions about a database.
	DatabaseURL string

	// The address the HTTP server listens on, as ":8080".
	Addr string

	// "development" or "production". Development is the exception that has to
	// be asked for; anything unrecognised is treated as production, so a typo
	// tightens the server rather than loosening it.
	Env string

	// Where the browser-facing site lives. Sign-in links are built from this
	// and never from a request header: a Host an attacker controls would
	// otherwise end up inside a one-time link mailed to a victim.
	SiteURL string

	// Which payment providers can take money. Both optional: with neither, a
	// number is claimed outright and free in development, and production
	// refuses to sell rather than doing the same.
	//
	// The identifiers, which go into the checkout address a buyer is sent to.
	// The secret keys, which verify a callback, are below.
	PaymeMerchantID string
	ClickServiceID  string
	ClickMerchantID string

	// The secret keys, which verify a callback rather than build a link.
	//
	// Set only on the deployment the merchant cabinets actually point at. Each
	// provider holds one callback URL per merchant account, and two servers
	// holding these keys is two state machines answering for one order.
	PaymeSecretKey string
	ClickSecretKey string

	// Sending the sign-in code. Eskiz.uz, which is what most of this market
	// sends through. The sender name has to be approved by the operator before
	// anything but their test text will send.
	EskizEmail    string
	EskizPassword string
	SMSFrom       string

	// The secret the daily reminder run is called with.
	//
	// The scheduler calls a URL, which makes the URL the security problem:
	// anyone can request it, and a reminder sent by a stranger at three in the
	// morning is a reminder wasted for the month. Empty refuses everybody
	// rather than defaulting open — an endpoint that is only safe because
	// nobody has guessed the path is not safe.
	CronSecret string

	// Who runs the shop, by account id.
	//
	// The fulfilment queue is the one screen that belongs to us rather than to
	// a customer: it lists what to manufacture and the addresses to post it to,
	// which is other people's personal data. So it is one account named in the
	// deployment's own configuration rather than a flag on a row — a boolean
	// column called `is_admin` is a column that can be set; an id that only
	// exists here cannot be granted by anything the application does.
	//
	// Empty closes the door rather than opening it: a deployment that has not
	// been told who the operator is must not decide that everybody is.
	OperatorUserID string

	// The bot that carries notifications. Empty means the Telegram channel is
	// not built at all, so a deployment without one has no channel rather than
	// a channel that fails on every notice.
	TelegramBotToken string

	// Sending account for the sign-in mail. Empty means no provider is
	// configured, and in development the link is written to the log instead.
	ResendAPIKey string
	MailFrom     string

	// Who may use the admin panel, by email address.
	//
	// A list in the environment rather than a table, because there is one
	// company running this and the list is two lines long. It moves to a table
	// the day somebody needs to grant access without a deploy — and the guard
	// that reads it does not change when it does.
	//
	// Empty means nobody, which is the safe direction: a deployment that forgot
	// the variable has no admin rather than an open one.
	AdminEmails []string

	// Whether X-Forwarded-For may be believed.
	//
	// Off by default, because a client can put anything in that header. Believing
	// it without a proxy in front means every rate limit in the system can be
	// stepped around by sending a different number each time. Turn it on only
	// when something trusted — Caddy, nginx, a load balancer — sets it.
	TrustProxy bool

	// How long a request may take before the server gives up on it.
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

func (c Config) IsDevelopment() bool { return c.Env == "development" }

// SMSConfigured says whether a real message can leave the building. Read by the
// one route that will show a sign-in code on screen: it does that only when
// nothing can send, so the moment an Eskiz account is configured the code stops
// being echoed without anybody remembering to turn it off.
func (c Config) SMSConfigured() bool { return c.EskizEmail != "" && c.EskizPassword != "" }

// TakesCallbacks reports whether this deployment is the one the merchant
// cabinets point at. Without a secret key a callback cannot be verified, so it
// would have to be refused — and a route that refuses everything is better not
// registered at all, since the provider then gets a 404 rather than a signature
// error it will retry for hours.
func (c Config) TakesCallbacks() bool {
	return c.PaymeSecretKey != "" || c.ClickSecretKey != ""
}

// Load builds the configuration, or explains what is missing.
func Load() (Config, error) {
	cfg := Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Addr:        withDefault("ADDR", ":8080"),
		Env:         normaliseEnv(os.Getenv("APP_ENV")),
		// Trimmed here so every caller building a link from it gets one slash.
		// The sign-in service trimmed it for itself and the checkout builder did
		// not, which is how a payment return address came to be
		// "https://flex-nfc.uz//buyurtma/...".
		SiteURL:          strings.TrimSuffix(withDefault("SITE_URL", "https://flex-nfc.uz"), "/"),
		PaymeMerchantID:  os.Getenv("PAYME_MERCHANT_ID"),
		ClickServiceID:   os.Getenv("CLICK_SERVICE_ID"),
		ClickMerchantID:  os.Getenv("CLICK_MERCHANT_ID"),
		PaymeSecretKey:   os.Getenv("PAYME_SECRET_KEY"),
		ClickSecretKey:   os.Getenv("CLICK_SECRET_KEY"),
		EskizEmail:       os.Getenv("ESKIZ_EMAIL"),
		EskizPassword:    os.Getenv("ESKIZ_PASSWORD"),
		SMSFrom:          withDefault("SMS_FROM", "4546"),
		CronSecret:       strings.TrimSpace(os.Getenv("CRON_SECRET")),
		OperatorUserID:   strings.TrimSpace(os.Getenv("OPERATOR_USER_ID")),
		TelegramBotToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
		ResendAPIKey:     os.Getenv("RESEND_API_KEY"),
		MailFrom:         withDefault("MAIL_FROM", "Flex <kirish@flex-nfc.uz>"),
		AdminEmails:      readList(os.Getenv("ADMIN_EMAILS")),
		TrustProxy:       os.Getenv("TRUST_PROXY") == "true",
		ReadTimeout:      15 * time.Second,
		WriteTimeout:     30 * time.Second,
	}

	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	// A production deployment with no mail provider cannot sign anybody in, and
	// the fallback writes live sign-in links to the log. Better to refuse to
	// start than to run in a state where the only way in is reading a log file.
	if !cfg.IsDevelopment() && cfg.ResendAPIKey == "" {
		missing = append(missing, "RESEND_API_KEY")
	}
	// Without these, the phone door writes sign-in codes to the log instead of
	// sending them — which is what development wants and what production must
	// never do, because nobody can sign in and nobody is told.
	if !cfg.IsDevelopment() && cfg.EskizEmail == "" {
		missing = append(missing, "ESKIZ_EMAIL")
	}

	if len(missing) > 0 {
		return Config{}, fmt.Errorf("sozlama yetishmayapti: %s", strings.Join(missing, ", "))
	}

	return cfg, nil
}

// IsAdmin reports whether an address may use the admin panel.
//
// Compared lowercased, because an address typed into a config file and one
// stored by the account system are the same address written by two people.
func (c Config) IsAdmin(email string) bool {
	if email == "" {
		return false
	}
	for _, allowed := range c.AdminEmails {
		if strings.EqualFold(allowed, email) {
			return true
		}
	}
	return false
}

// readList splits a comma-separated setting, dropping the spaces somebody put
// after the commas.
func readList(raw string) []string {
	var out []string
	for _, piece := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(piece); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func withDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func normaliseEnv(raw string) string {
	if strings.EqualFold(raw, "development") || strings.EqualFold(raw, "dev") {
		return "development"
	}
	return "production"
}
