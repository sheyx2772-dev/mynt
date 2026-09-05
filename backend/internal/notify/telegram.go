package notify

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// Telegram, because it is what this market actually reads.
//
// Free per message, already on the phone of every business owner here, and it
// needs no verified domain — which matters while transactional email cannot be
// sent at all. The phone app will take push notifications when it ships, and
// that is one more Channel rather than a replacement: not everybody will
// install it.

type Telegram struct {
	token  string
	client *http.Client
}

// NewTelegram returns nil when there is no bot token, so a deployment without
// one has no Telegram channel rather than a channel that fails every time.
func NewTelegram(token string) *Telegram {
	if token == "" {
		return nil
	}
	return &Telegram{
		token: token,
		// A notification must never hold up the thing that caused it.
		client: &http.Client{Timeout: 5 * time.Second},
	}
}

func (t *Telegram) Name() string { return "telegram" }

func (t *Telegram) Send(ctx context.Context, notice Notice, chatID int64) bool {
	if t == nil || chatID == 0 {
		return false
	}

	lines := []string{"<b>" + escapeHTML(notice.Title) + "</b>"}
	if notice.Body != "" {
		lines = append(lines, escapeHTML(notice.Body))
	}

	body, err := json.Marshal(map[string]any{
		"chat_id":                  chatID,
		"text":                     strings.Join(lines, "\n\n"),
		"parse_mode":               "HTML",
		"disable_web_page_preview": true,
	})
	if err != nil {
		return false
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.token)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return false
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := t.client.Do(req)
	if err != nil {
		// Down, slow, or blocked. The notice is already recorded; losing the
		// delivery is not losing the event.
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

// escapeHTML guards Telegram's own markup against text a stranger typed into a
// form. A lead's name reaches this function exactly as it was submitted.
func escapeHTML(text string) string {
	return strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;").Replace(text)
}
