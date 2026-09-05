package notify

import (
	"context"
	"crypto/rand"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Linking an account to a Telegram chat.
//
// The person asks the site for a code and sends it to the bot. That direction
// is the only one that works without asking for their phone number or their
// Telegram username: Telegram will not tell us who they are, so they have to
// tell Telegram who they are on our behalf.
//
// The code is a bearer secret while it lives — whoever sends it to the bot
// becomes that account's Telegram. So it is short, random, single-use and
// expires quickly, and it is spent by the same statement that accepts it.

const codeTTL = 15 * time.Minute

// Six characters from an alphabet without the pairs people mistype when
// copying between two screens: no O and 0, no I and 1.
const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const codeLength = 6

// TelegramLink is where the linking has got to.
type TelegramLink struct {
	// Whether there is a bot to link to at all. False is a deployment with no
	// token, and the screen says so rather than offering a button that opens
	// onto nothing.
	Available bool `json:"mavjud"`
	// "unavailable" when nothing is outstanding, "linked" once a chat is
	// attached, "waiting" while a code is live.
	State     string     `json:"holat" enum:"unavailable,waiting,linked"`
	Code      string     `json:"kod,omitempty"`
	ExpiresAt *time.Time `json:"tugaydi,omitempty"`
}

// Linked reports whether a Telegram channel exists to link to at all.
func (s *Service) Linked() bool {
	return len(s.channels) > 0
}

// LinkState reads where one account's linking has got to.
func (s *Service) LinkState(ctx context.Context, userID string) (TelegramLink, error) {
	if !s.Linked() {
		return TelegramLink{Available: s.Linked(), State: "unavailable"}, nil
	}

	owner, err := uuid.Parse(userID)
	if err != nil {
		return TelegramLink{}, err
	}

	row, err := s.queries.LinkState(ctx, owner)
	if errors.Is(err, pgx.ErrNoRows) {
		// Never asked. Not an error — there is simply nothing linked.
		return TelegramLink{Available: s.Linked(), State: "unavailable"}, nil
	}
	if err != nil {
		return TelegramLink{}, err
	}

	if row.TelegramChatID != nil {
		return TelegramLink{Available: true, State: "linked"}, nil
	}

	// An expired code is not shown. Somebody looking at a code that will not
	// work is worse than somebody looking at the button that makes a new one.
	if row.TelegramLinkCode != nil && row.TelegramLinkExpiresAt.Valid &&
		row.TelegramLinkExpiresAt.Time.After(time.Now()) {
		return TelegramLink{
			Available: true,
			State:     "waiting",
			Code:      *row.TelegramLinkCode,
			ExpiresAt: &row.TelegramLinkExpiresAt.Time,
		}, nil
	}

	return TelegramLink{Available: s.Linked(), State: "unavailable"}, nil
}

// StartLink issues a fresh code, replacing any still outstanding.
func (s *Service) StartLink(ctx context.Context, userID string) (TelegramLink, error) {
	if !s.Linked() {
		return TelegramLink{Available: s.Linked(), State: "unavailable"}, nil
	}

	owner, err := uuid.Parse(userID)
	if err != nil {
		return TelegramLink{}, err
	}

	code, err := newCode()
	if err != nil {
		return TelegramLink{}, err
	}

	expires := time.Now().Add(codeTTL)
	row, err := s.queries.StartLink(ctx, store.StartLinkParams{
		UserID:    owner,
		Code:      &code,
		ExpiresAt: pgtype.Timestamptz{Time: expires, Valid: true},
	})
	if err != nil {
		return TelegramLink{}, err
	}

	return TelegramLink{
		Available: true,
		State:     "waiting",
		Code:      deref(row.TelegramLinkCode),
		ExpiresAt: optionalTime(row.TelegramLinkExpiresAt),
	}, nil
}

// Unlink detaches the chat. Somebody who has lost the phone the bot is on has
// to be able to stop it going there.
func (s *Service) Unlink(ctx context.Context, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	_, err = s.queries.UnlinkTelegram(ctx, owner)
	return err
}

// newCode draws a code from crypto/rand.
//
// The modulo is unbiased because the alphabet is 32 characters and a byte holds
// 256 values: every character is reachable by exactly eight of them.
func newCode() (string, error) {
	bytes := make([]byte, codeLength)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	out := make([]byte, codeLength)
	for i, b := range bytes {
		out[i] = codeAlphabet[int(b)%len(codeAlphabet)]
	}
	return string(out), nil
}
