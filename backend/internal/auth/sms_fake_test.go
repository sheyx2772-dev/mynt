package auth

import "context"

// An SMS channel that keeps its messages in a slice.
//
// The tests need to read the code that would have been sent, which is the only
// way to get one out of the service — exactly as it is for a real person.
type capturedSMS struct {
	sent []struct{ phone, text string }
}

func (c *capturedSMS) Send(_ context.Context, phone, text string) error {
	c.sent = append(c.sent, struct{ phone, text string }{phone, text})
	return nil
}
