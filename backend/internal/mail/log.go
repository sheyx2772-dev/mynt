package mail

import (
	"context"
	"log/slog"
)

// LogMailer prints the message instead of sending it.
//
// What development wants: no account, no key, no waiting, and the sign-in link
// visible in the same terminal the server is running in. It is chosen only
// when no provider is configured, and the server says so at boot — so a
// production deployment that forgot its key is loud rather than silently
// swallowing every sign-in.
type LogMailer struct{}

func (LogMailer) Send(_ context.Context, msg Message) error {
	// The body carries a live sign-in token. That is exactly what makes this
	// useful in a terminal and unacceptable anywhere a log is kept, which is
	// why the constructor refuses to choose it in production.
	slog.Warn("xat yuborilmadi — jurnalga yozildi",
		"kimga", msg.To,
		"mavzu", msg.Subject,
		"matn", msg.Body,
	)
	return nil
}
