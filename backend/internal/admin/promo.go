package admin

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/sheyx2772-dev/flex/backend/internal/promo"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Promo codes, as the panel makes and reads them.

var ErrBadPromo = errors.New("kod ma'lumotlari noto'g'ri")

// PromoCode is one code and how much of it is left.
type PromoCode struct {
	Code string `json:"kod"`
	Kind string `json:"turi" enum:"percent,amount,months"`
	// Per kind: a percentage, a number of so'm, or a number of months.
	Value int32 `json:"qiymati"`
	// A ceiling on a percentage, in so'm.
	MaxDiscount *int64 `json:"eng_kop_chegirma,omitempty"`

	AppliesTo []string `json:"nimaga"`

	MaxUses  *int32 `json:"necha_marta,omitempty"`
	Used     int32  `json:"ishlatilgan"`
	Redeemed int64  `json:"kimlar_ishlatgan"`

	OncePerAccount bool   `json:"bir_hisob_bir_marta"`
	MinAmount      *int64 `json:"eng_kam_summa,omitempty"`

	StartsAt  *time.Time `json:"boshlanishi,omitempty"`
	ExpiresAt *time.Time `json:"tugashi,omitempty"`

	Active bool   `json:"faol"`
	Note   string `json:"izoh,omitempty"`
}

// NewPromoCode is what the panel sends. Dates are whole days, which is what a
// campaign is measured in.
type NewPromoCode struct {
	Code           string   `json:"kod" pattern:"^[A-Za-z0-9-]{3,32}$" example:"YOZ2026"`
	Kind           string   `json:"turi" enum:"percent,amount,months"`
	Value          int32    `json:"qiymati" minimum:"1"`
	MaxDiscount    int64    `json:"eng_kop_chegirma,omitempty" minimum:"0" doc:"Foizli kod uchun yuqori chegara, so'mda"`
	AppliesTo      []string `json:"nimaga,omitempty" doc:"handle, subscription, device, venue — bo'sh bo'lsa hammasi"`
	MaxUses        int32    `json:"necha_marta,omitempty" minimum:"0" doc:"0 — cheksiz"`
	OncePerAccount bool     `json:"bir_hisob_bir_marta,omitempty"`
	MinAmount      int64    `json:"eng_kam_summa,omitempty" minimum:"0"`
	StartsAt       string   `json:"boshlanishi,omitempty" doc:"YYYY-MM-DD"`
	ExpiresAt      string   `json:"tugashi,omitempty" doc:"YYYY-MM-DD"`
	Note           string   `json:"izoh,omitempty" maxLength:"200"`
}

func (s *Store) PromoCodes(ctx context.Context, limit int32) ([]PromoCode, error) {
	rows, err := s.queries.PromoCodes(ctx, limit)
	if err != nil {
		return nil, err
	}

	out := make([]PromoCode, 0, len(rows))
	for _, row := range rows {
		out = append(out, PromoCode{
			Code:           row.Code,
			Kind:           row.Kind,
			Value:          row.Value,
			MaxDiscount:    row.MaxDiscount,
			AppliesTo:      row.AppliesTo,
			MaxUses:        row.MaxUses,
			Used:           row.UsedCount,
			Redeemed:       row.Redeemed,
			OncePerAccount: row.OncePerAccount,
			MinAmount:      row.MinAmount,
			StartsAt:       optionalTime(row.StartsAt),
			ExpiresAt:      optionalTime(row.ExpiresAt),
			Active:         row.Active,
			Note:           deref(row.Note),
		})
	}
	return out, nil
}

func (s *Store) CreatePromoCode(ctx context.Context, in NewPromoCode) (PromoCode, error) {
	code, ok := promo.Normalise(in.Code)
	if !ok {
		return PromoCode{}, ErrBadPromo
	}

	// A percentage that is not one, or a code that gives nothing, would be
	// refused by the schema — but the schema's message is for a developer.
	if in.Kind == promo.KindPercent && (in.Value < 1 || in.Value > 100) {
		return PromoCode{}, errors.New("foiz 1 dan 100 gacha bo'lsin")
	}
	if in.Value < 1 {
		return PromoCode{}, errors.New("qiymat noldan katta bo'lsin")
	}

	applies := in.AppliesTo
	if len(applies) == 0 {
		// Everything, which is what somebody making a code without thinking
		// about it means.
		applies = []string{promo.ForHandle, promo.ForSubscription, promo.ForDevice, promo.ForVenue}
	}
	for _, kind := range applies {
		switch kind {
		case promo.ForHandle, promo.ForSubscription, promo.ForDevice, promo.ForVenue:
		default:
			return PromoCode{}, ErrBadPromo
		}
	}

	starts, err := parseDay(in.StartsAt)
	if err != nil {
		return PromoCode{}, errors.New("boshlanish sanasi noto'g'ri")
	}
	expires, err := parseDay(in.ExpiresAt)
	if err != nil {
		return PromoCode{}, errors.New("tugash sanasi noto'g'ri")
	}

	row, err := s.queries.CreatePromoCode(ctx, store.CreatePromoCodeParams{
		Code:           code,
		Kind:           in.Kind,
		Value:          in.Value,
		MaxDiscount:    positive(in.MaxDiscount),
		AppliesTo:      applies,
		MaxUses:        positive32(in.MaxUses),
		OncePerAccount: in.OncePerAccount,
		MinAmount:      positive(in.MinAmount),
		StartsAt:       stamp(starts),
		ExpiresAt:      stamp(expires),
		Note:           optional(in.Note),
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return PromoCode{}, ErrTaken
		}
		if errors.As(err, &pgErr) && pgErr.Code == "23514" {
			// A check constraint. The schema is the last word on what a code
			// may be, and this is it saying no.
			return PromoCode{}, ErrBadPromo
		}
		return PromoCode{}, err
	}

	return PromoCode{
		Code: row.Code, Kind: row.Kind, Value: row.Value, MaxDiscount: row.MaxDiscount,
		AppliesTo: row.AppliesTo, MaxUses: row.MaxUses, OncePerAccount: row.OncePerAccount,
		MinAmount: row.MinAmount, StartsAt: optionalTime(row.StartsAt),
		ExpiresAt: optionalTime(row.ExpiresAt), Active: row.Active, Note: deref(row.Note),
	}, nil
}

func (s *Store) SetPromoActive(ctx context.Context, code string, active bool) error {
	normalised, ok := promo.Normalise(code)
	if !ok {
		return ErrBadPromo
	}
	return s.queries.SetPromoCodeActive(ctx, store.SetPromoCodeActiveParams{
		Active: active, Code: normalised,
	})
}
