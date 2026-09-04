// Package mail sends the one message this system sends: a sign-in link.
package mail

import "context"

type Message struct {
	To      string
	Subject string
	// Plain text. A sign-in mail with no HTML lands in fewer spam folders,
	// renders the same everywhere, and has nothing in it that would benefit
	// from markup.
	Body string
}

// Mailer is an interface so that development does not need an account
// anywhere, and so that changing provider is one constructor rather than a
// search through the code that sends mail.
type Mailer interface {
	Send(ctx context.Context, msg Message) error
}
