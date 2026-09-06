package api

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"

	"github.com/sheyx2772-dev/flex/backend/internal/orders"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Sovg'alar: the catalogue, buying one for a number, the shelf on a profile,
// and the owner's switch for each.

type stickersOutput struct {
	Body struct {
		Stickers []orders.Sticker `json:"stikerlar"`
	}
}

type giftInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Sticker string `json:"stiker" minLength:"1" maxLength:"20"`
		Note    string `json:"xabar,omitempty" maxLength:"140"`
	}
}

// Gift is one on the shelf.
type Gift struct {
	ID      int64     `json:"id"`
	Sticker string    `json:"stiker"`
	Emoji   string    `json:"emoji"`
	Name    string    `json:"nom"`
	Tier    string    `json:"daraja"`
	Note    string    `json:"xabar,omitempty"`
	Shown   bool      `json:"korsatiladi"`
	At      time.Time `json:"vaqt"`
	From    string    `json:"kimdan"`
	FromRaq string    `json:"kimdan_raqam,omitempty"`
	FromImg string    `json:"kimdan_rasm,omitempty"`
}

// GiftCount is one tile: which sticker, how many.
type GiftCount struct {
	Sticker string `json:"stiker"`
	Emoji   string `json:"emoji"`
	Name    string `json:"nom"`
	Tier    string `json:"daraja"`
	Count   int64  `json:"soni"`
}

type giftsInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Limit int    `query:"soni" minimum:"1" maximum:"200" default:"60"`
}

type giftsOutput struct {
	Body struct {
		Gifts  []Gift      `json:"sovgalar"`
		Counts []GiftCount `json:"jami"`
	}
}

type giftShownInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	ID    int64  `path:"id"`
	Body  struct {
		Shown bool `json:"korsatiladi"`
	}
}

func (s *Server) registerGifts(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "stikerlar",
		Method:      http.MethodGet,
		Path:        "/sovgalar",
		Summary:     "Sovg'a stikerlar katalogi",
		Tags:        []string{"sovg'a"},
	}, func(ctx context.Context, _ *struct{}) (*stickersOutput, error) {
		out := &stickersOutput{}
		out.Body.Stickers = orders.Stickers
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "sovga-qilish",
		Method:        http.MethodPost,
		Path:          "/profil/{raqam}/sovga",
		Summary:       "Profilga stiker sovg'a qilish",
		Description:   "Narx shu yerda hisoblanadi. Sovg'a to'lov kelgandan keyin profilda ko'rinadi.",
		Tags:          []string{"sovg'a"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *giftInput) (*orderOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		order, err := s.orders.Gift(ctx, account.ID, raqam, in.Body.Sticker, in.Body.Note)
		switch {
		case errors.Is(err, orders.ErrCannotSell):
			return nil, huma.Error503ServiceUnavailable("To'lov tizimi hali ulanmagan. Biz bilan bog'laning.")
		case errors.Is(err, orders.ErrNotFound):
			return nil, huma.Error404NotFound("Bunday raqam yoki stiker yo'q.")
		case err != nil:
			return nil, internalError(err, "sovg'a buyurtmasi ochilmadi")
		}

		// Delivered at once — the development give-away — so the recipient
		// is told now rather than by a settlement that never comes.
		if order.Status == "paid" {
			s.announceGift(ctx, raqam, account.ID, in.Body.Sticker, in.Body.Note)
		}

		out := &orderOutput{}
		out.Body.Order = order
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "sovgalar",
		Method:      http.MethodGet,
		Path:        "/profil/{raqam}/sovgalar",
		Summary:     "Profildagi sovg'alar",
		Tags:        []string{"sovg'a"},
	}, func(ctx context.Context, in *giftsInput) (*giftsOutput, error) {
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		// The owner sees the hidden ones too, flagged. Decided by the same
		// ownership read every cabinet screen uses, so a stranger asking for
		// the hidden ones gets the shelf as everybody sees it.
		mine := false
		if viewer, ok := accountFrom(ctx); ok {
			if _, err := s.handles.Owned(ctx, raqam, viewer.ID); err == nil {
				mine = true
			}
		}

		q := store.New(s.pool)
		rows, err := q.Gifts(ctx, store.GiftsParams{Handle: raqam, IncludeHidden: mine, PageSize: int32(in.Limit)})
		if err != nil {
			return nil, internalError(err, "sovg'alar o'qilmadi")
		}
		counts, err := q.GiftCounts(ctx, raqam)
		if err != nil {
			return nil, internalError(err, "sovg'alar sanalmadi")
		}

		out := &giftsOutput{}
		out.Body.Gifts = make([]Gift, 0, len(rows))
		for _, r := range rows {
			sticker, _ := orders.StickerByID(r.Sticker)
			from := "Mehmon"
			if r.SenderName != nil && *r.SenderName != "" {
				from = *r.SenderName
			}
			out.Body.Gifts = append(out.Body.Gifts, Gift{
				ID: r.ID, Sticker: r.Sticker, Emoji: sticker.Emoji, Name: sticker.Name, Tier: sticker.Tier,
				Note: r.Note, Shown: r.Korsatiladi, At: r.CreatedAt.Time,
				From: from, FromRaq: derefString(r.SenderHandle), FromImg: derefString(r.SenderAvatar),
			})
		}
		out.Body.Counts = make([]GiftCount, 0, len(counts))
		for _, c := range counts {
			sticker, _ := orders.StickerByID(c.Sticker)
			out.Body.Counts = append(out.Body.Counts, GiftCount{
				Sticker: c.Sticker, Emoji: sticker.Emoji, Name: sticker.Name, Tier: sticker.Tier, Count: c.Soni,
			})
		}
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "sovgani-korsatish",
		Method:        http.MethodPut,
		Path:          "/raqamlar/{raqam}/sovgalar/{id}",
		Summary:       "Sovg'ani javondan olish yoki qaytarish",
		Tags:          []string{"sovg'a"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *giftShownInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}
		owner, err := parseUUID(account.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Sovg'a topilmadi.")
		}

		n, err := store.New(s.pool).SetGiftShown(ctx, store.SetGiftShownParams{
			Shown: in.Body.Shown, OwnerID: &owner, ID: in.ID, Handle: raqam,
		})
		if err != nil {
			return nil, internalError(err, "sovg'a o'zgarmadi")
		}
		if n == 0 {
			return nil, huma.Error404NotFound("Sovg'a topilmadi.")
		}
		return nil, nil
	})
}

// announceGift tells the recipient about a gift delivered outside settlement.
func (s *Server) announceGift(ctx context.Context, handle, fromUserID, sticker, note string) {
	q := store.New(s.pool)
	owner, err := q.GiftRecipient(ctx, &handle)
	if err != nil || owner.UserID == nil || owner.UserID.String() == fromUserID {
		return
	}
	from := ""
	if id, err := parseUUID(fromUserID); err == nil {
		if name, err := q.SenderName(ctx, &id); err == nil && name != nil {
			from = *name
		}
	}
	go s.notify.Send(context.WithoutCancel(ctx), orders.GiftNotice(owner.UserID.String(), handle, sticker, from, note))
}

func parseUUID(raw string) (uuid.UUID, error) { return uuid.Parse(raw) }

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
