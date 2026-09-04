package mail

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Resend sends through resend.com.
//
// Chosen over SMTP because sign-in mail has one job — arriving — and a
// provider that manages SPF, DKIM and a warm sending reputation does that
// better than a server sending its own. Swapping it means writing another
// Mailer, which is why Mailer exists.
type Resend struct {
	apiKey string
	from   string
	client *http.Client
}

func NewResend(apiKey, from string) *Resend {
	return &Resend{
		apiKey: apiKey,
		from:   from,
		// A sign-in is a person waiting at a form. Ten seconds is already
		// longer than they will believe; without a timeout the default is
		// none at all, and a hung provider becomes a hung request.
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (r *Resend) Send(ctx context.Context, msg Message) error {
	body, err := json.Marshal(map[string]string{
		"from":    r.from,
		"to":      msg.To,
		"subject": msg.Subject,
		"text":    msg.Body,
	})
	if err != nil {
		return err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", "Bearer "+r.apiKey)
	request.Header.Set("Content-Type", "application/json")

	response, err := r.client.Do(request)
	if err != nil {
		return fmt.Errorf("xat yuborilmadi: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode >= 300 {
		// Read a little of the body: the provider says why, and without it the
		// only clue is a status code. Capped, because an error page can be a
		// megabyte of HTML.
		detail, _ := io.ReadAll(io.LimitReader(response.Body, 512))
		return fmt.Errorf("xat yuborilmadi (%d): %s", response.StatusCode, detail)
	}

	// The rest of the body is drained so the connection can be reused rather
	// than closed and reopened for the next message.
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 1<<16))
	return nil
}
