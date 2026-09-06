package orders

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/notify"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Sovg'a stikerlar: a sticker bought for somebody's profile.
//
// The catalogue and the prices live here, like device prices, because both
// decide money. An amount that arrives with an order is an amount the buyer
// chose; a sticker id that arrives with one is looked up here and refused if
// it is not on the list.

// Sticker is one thing that can be given.
type Sticker struct {
	ID    string `json:"id"`
	Name  string `json:"nom"`
	Emoji string `json:"emoji"`
	// So'm. Whole thousands, because that is how prices are read here.
	Price int64 `json:"narx"`
	// oddiy, kumush, oltin, noyob — the shelf draws each tier differently.
	Tier string `json:"daraja" enum:"oddiy,kumush,oltin,noyob"`
}

// The catalogue, cheapest first. Nine, on purpose: a shelf a person can read
// in one look, with a top that costs something to be seen with.
var Stickers = []Sticker{
	{ID: "gul", Name: "Gul", Emoji: "🌹", Price: 5_000, Tier: "oddiy"},
	{ID: "tort", Name: "Tort", Emoji: "🎂", Price: 10_000, Tier: "oddiy"},
	{ID: "yulduz", Name: "Yulduz", Emoji: "⭐", Price: 15_000, Tier: "oddiy"},
	{ID: "olov", Name: "Olov", Emoji: "🔥", Price: 20_000, Tier: "kumush"},
	{ID: "kubok", Name: "Kubok", Emoji: "🏆", Price: 30_000, Tier: "kumush"},
	{ID: "toj", Name: "Toj", Emoji: "👑", Price: 50_000, Tier: "oltin"},
	{ID: "olmos", Name: "Olmos", Emoji: "💎", Price: 100_000, Tier: "oltin"},
	{ID: "raketa", Name: "Raketa", Emoji: "🚀", Price: 150_000, Tier: "oltin"},
	{ID: "flex", Name: "Flex", Emoji: "⚡", Price: 500_000, Tier: "noyob"},
}

// StickerByID finds one, and says whether it exists.
func StickerByID(id string) (Sticker, bool) {
	for _, s := range Stickers {
		if s.ID == id {
			return s, true
		}
	}
	return Sticker{}, false
}

// Gift opens an order for a sticker and says where to pay for it.
//
// A deployment with no provider delivers it at once in development — the
// same give-away a number gets — and refuses in production, so nothing is
// ever put on a shelf that nobody paid for.
func (s *Store) Gift(ctx context.Context, userID, handle, stickerID, note string) (Order, error) {
	sticker, ok := StickerByID(stickerID)
	if !ok {
		return Order{}, ErrNotFound
	}
	buyer, err := uuid.Parse(userID)
	if err != nil {
		return Order{}, ErrNotFound
	}
	if !s.paid.Any() && !s.paid.GiveAway(s.development) {
		return Order{}, ErrCannotSell
	}

	row, err := s.queries.PlaceGiftOrder(ctx, store.PlaceGiftOrderParams{
		UserID: buyer, Handle: &handle, Amount: sticker.Price, Sticker: &sticker.ID,
		Note: optional(strings.TrimSpace(note)),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Order{}, ErrNotFound
	}
	if err != nil {
		return Order{}, err
	}

	order := Order{
		ID: row.ID.String(), Number: row.Handle, Amount: row.Amount,
		Status: row.Status, Kind: row.Kind, Held: true,
	}

	if s.paid.GiveAway(s.development) {
		// No provider and no transaction: the row says paid with nobody
		// named, which the provider check allows and which is the truth.
		if _, err := s.queries.SettleOrder(ctx, store.SettleOrderParams{ID: row.ID}); err != nil {
			return Order{}, err
		}
		if _, err := s.queries.DeliverGift(ctx, row.ID); err != nil {
			return Order{}, err
		}
		order.Status = "paid"
		return order, nil
	}

	order.Checkout = s.paid.checkoutFor(order.ID, returnPathFor("gift", order.ID), order.Amount, 0)
	return order, nil
}

// GiftNotice is what the recipient is told when one lands. Built here so the
// two paths that deliver — settlement and the development give-away — say
// the same thing.
func GiftNotice(ownerID, handle, stickerID, fromName, note string) notify.Notice {
	sticker, _ := StickerByID(stickerID)
	from := fromName
	if from == "" {
		from = "Kimdir"
	}
	body := from + " sizga " + sticker.Emoji + " " + sticker.Name + " sovg'a qildi."
	if note != "" {
		body += " «" + note + "»"
	}
	return notify.Notice{
		UserID: ownerID,
		Kind:   notify.KindGift,
		Handle: handle,
		Title:  "Sizga sovg'a keldi " + sticker.Emoji,
		Body:   body,
		Href:   "/" + handle,
	}
}
