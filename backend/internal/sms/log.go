package sms

import (
	"context"
	"log/slog"
)

// LogSender prints the message instead of sending it.
//
// What development wants: no account, no cost, and the code visible in the same
// terminal the server runs in. Chosen only when no provider is configured, and
// `config.Load` refuses to start a production process in that state — a
// deployment that quietly logs sign-in codes instead of sending them is a
// deployment where nobody can sign in and nobody is told.
type LogSender struct{}

func (LogSender) Send(_ context.Context, phone, text string) error {
	// The text carries a live sign-in code, which is what makes this useful in
	// a terminal and unacceptable anywhere a log is kept.
	slog.Warn("SMS yuborilmadi — jurnalga yozildi", "raqam", phone, "matn", text)
	return nil
}
