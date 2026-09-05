package notify

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Reading what the bot has been sent, and completing any link it can.
//
// Polling rather than a webhook, because a webhook needs a public address and
// a certificate for it. It runs when somebody is watching the linking screen,
// which is the only moment it matters — and it is cheap, since Telegram only
// holds updates the bot has not acknowledged.

// A code, and nothing else. Anything that is not exactly six characters of the
// alphabet is somebody talking to the bot, which is not an error.
var codeShape = regexp.MustCompile(`^[A-Z2-9]{6}$`)

// A Telegram poller. `*Telegram` satisfies it; a test can supply its own.
type poller interface {
	Updates(ctx context.Context, offset int64) ([]Update, error)
}

// Drain completes every link it finds waiting, and reports how many.
func (s *Service) Drain(ctx context.Context) (int, error) {
	source, ok := s.updates()
	if !ok {
		return 0, nil
	}

	updates, err := source.Updates(ctx, 0)
	if err != nil || len(updates) == 0 {
		return 0, err
	}

	linked := 0
	highest := int64(0)

	for _, update := range updates {
		if update.UpdateID > highest {
			highest = update.UpdateID
		}

		// Codes arrive as the whole message, or after /start. Upper-cased
		// first so the command is matched whatever the client sent.
		code := strings.ToUpper(strings.TrimSpace(update.Text))
		code = strings.TrimSpace(strings.TrimPrefix(code, "/START"))
		if !codeShape.MatchString(code) {
			continue
		}

		owner, err := s.queries.CompleteLink(ctx, store.CompleteLinkParams{Code: &code, ChatID: &update.ChatID})
		if errors.Is(err, pgx.ErrNoRows) {
			// Wrong code, or an expired one. Nothing is said back: a bot that
			// answers "no such code" is a bot that can be used to test codes.
			continue
		}
		if err != nil {
			return linked, err
		}

		linked++

		for _, channel := range s.channels {
			channel.Send(ctx, Notice{
				UserID: owner.String(),
				Kind:   KindLead,
				Title:  "Flex ulandi",
				Body:   "Endi kontakt kelganda shu yerga xabar beramiz.",
			}, update.ChatID)
		}
	}

	// Acknowledge everything read, so the same messages are not processed
	// again. Done last: a run that dies before this repeats itself, which is
	// harmless, where acknowledging first would lose a link.
	if highest > 0 {
		_, _ = source.Updates(ctx, highest+1)
	}

	return linked, nil
}

// updates finds the Telegram channel among the configured ones.
func (s *Service) updates() (poller, bool) {
	for _, channel := range s.channels {
		if source, ok := channel.(poller); ok {
			return source, true
		}
	}
	return nil, false
}
