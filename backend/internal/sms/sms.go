// Package sms sends the one message this system sends by SMS: a sign-in code.
//
// An interface, for the same reason `mail` is one: development should not need
// somebody's provider account, and changing provider should be one constructor
// rather than a search through the code that sends messages.
//
// It matters more here than it does for mail, because every message costs
// money. A provider that is misconfigured and silently succeeding is a bill;
// one that is misconfigured and loudly failing is a bug somebody fixes.
package sms

import "context"

type Sender interface {
	// Send delivers a message to a number in E.164 without the plus.
	//
	// Returns an error when the provider refused it. A message that was
	// accepted and never arrived is not an error here — nobody can tell — which
	// is why the app has a second way in.
	Send(ctx context.Context, phone, text string) error
}
