// Package tags is a sticker on an object — a table, a room, a shelf — that
// somebody taps to say something to whoever owns the number.
//
// The token in the tag is the whole credential, the way the counter link is.
// It has to be, because the person tapping it has no account and never will:
// they are a guest, and asking them to sign in to say the wifi is down is
// asking them not to bother.
package tags

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/netip"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

var ErrNotFound = errors.New("teg topilmadi")

type Store struct {
	pool    *pgxpool.Pool
	queries *store.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool, queries: store.New(pool)}
}

type Tag struct {
	ID     string    `json:"id"`
	Token  string    `json:"kalit,omitempty"`
	Kind   string    `json:"turi"`
	Label  string    `json:"nom"`
	Active bool      `json:"faol"`
	Unread int64     `json:"oqilmagan"`
	At     time.Time `json:"yaratilgan"`
	// Only set when a tag is read by its token: the guest's page says whose
	// number they are writing to.
	Handle string `json:"raqam,omitempty"`
}

type Message struct {
	ID      string    `json:"id"`
	Tag     string    `json:"teg,omitempty"`
	TagID   string    `json:"teg_id,omitempty"`
	Kind    string    `json:"turi"`
	Body    string    `json:"matn"`
	ReplyTo string    `json:"javob_uchun,omitempty"`
	Place   string    `json:"joy,omitempty"`
	Read    bool      `json:"oqilgan"`
	At      time.Time `json:"vaqt"`
}

// NewToken is what goes into the sticker's address. Long, because it is the
// only thing standing between a stranger and somebody's inbox.
func NewToken() (string, error) {
	raw := make([]byte, 18)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

// ByToken is what the guest's page reads. Inactive tags are not found: a
// sticker taken off a table should stop working the moment it is switched off.
func (s *Store) ByToken(ctx context.Context, token string) (Tag, error) {
	row, err := s.queries.TagByToken(ctx, token)
	if errors.Is(err, pgx.ErrNoRows) {
		return Tag{}, ErrNotFound
	}
	if err != nil {
		return Tag{}, err
	}

	return Tag{
		ID: row.ID.String(), Kind: row.Kind, Label: derefString(row.Label),
		Active: row.Active, At: row.CreatedAt.Time,
		Handle: derefString(row.Normalized),
	}, nil
}

func (s *Store) ForHandle(ctx context.Context, handle, userID string) ([]Tag, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.queries.TagsForHandle(ctx, store.TagsForHandleParams{
		Handle: &handle, UserID: &owner,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Tag, 0, len(rows))
	for _, row := range rows {
		out = append(out, Tag{
			ID: row.ID.String(), Token: row.Token, Kind: row.Kind,
			Label: derefString(row.Label), Active: row.Active,
			Unread: row.Unread, At: row.CreatedAt.Time,
		})
	}
	return out, nil
}

func (s *Store) Create(ctx context.Context, handle, userID, kind, label string) (Tag, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Tag{}, ErrNotFound
	}

	token, err := NewToken()
	if err != nil {
		return Tag{}, err
	}

	row, err := s.queries.CreateTag(ctx, store.CreateTagParams{
		Handle: &handle, UserID: &owner, Token: token, Kind: kind, Label: &label,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Tag{}, ErrNotFound
	}
	if err != nil {
		return Tag{}, err
	}

	return Tag{
		ID: row.ID.String(), Token: row.Token, Kind: row.Kind,
		Label: derefString(row.Label), Active: row.Active, At: row.CreatedAt.Time,
	}, nil
}

func (s *Store) SetActive(ctx context.Context, id uuid.UUID, userID string, active bool) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.SetTagActive(ctx, store.SetTagActiveParams{
		ID: id, UserID: &owner, Active: active,
	}))
}

// Say records what a guest wrote. No session, by design.
func (s *Store) Say(ctx context.Context, token, kind, body, replyTo, place string, ip *netip.Addr) (Message, error) {
	var address *string
	if ip != nil {
		text := ip.String()
		address = &text
	}

	row, err := s.queries.CreateTagMessage(ctx, store.CreateTagMessageParams{
		Token: token, Kind: kind, Body: &body,
		ReplyTo: optional(replyTo), Place: optional(place), Ip: address,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Message{}, ErrNotFound
	}
	if err != nil {
		return Message{}, err
	}
	return toMessage(row.ID, row.Kind, row.Body, row.ReplyTo, row.Place, row.ReadAt, row.CreatedAt, "", ""), nil
}

func (s *Store) Messages(ctx context.Context, handle, userID string, limit int32) ([]Message, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.queries.TagMessages(ctx, store.TagMessagesParams{
		Handle: &handle, UserID: &owner, PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Message, 0, len(rows))
	for _, row := range rows {
		out = append(out, toMessage(row.ID, row.Kind, row.Body, row.ReplyTo, row.Place, row.ReadAt, row.CreatedAt, derefString(row.Label), row.TagIDOut.String()))
	}
	return out, nil
}

func (s *Store) MarkRead(ctx context.Context, handle, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return s.queries.MarkTagMessagesRead(ctx, store.MarkTagMessagesReadParams{
		Handle: &handle, UserID: &owner,
	})
}

func (s *Store) Unread(ctx context.Context, handle string) int64 {
	n, err := s.queries.CountUnreadTagMessages(ctx, &handle)
	if err != nil {
		return 0
	}
	return n
}

func toMessage(id int64, kind string, body *string, replyTo, place *string, readAt, at pgtype.Timestamptz, label, tagID string) Message {
	return Message{
		ID: strconv.FormatInt(id, 10), Tag: label, TagID: tagID, Kind: kind, Body: derefString(body),
		ReplyTo: derefString(replyTo), Place: derefString(place),
		Read: readAt.Valid, At: at.Time,
	}
}

func rowsOrNotFound(rows int64, err error) error {
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func optional(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
