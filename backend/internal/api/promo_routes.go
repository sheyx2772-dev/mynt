package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/admin"
)

// Promo codes, in the panel.
//
// Reading and making them is administrative; using one is part of buying and
// lives on the purchase endpoint. There is no route that tells an outsider
// whether a code exists — trying one against a real purchase is the only way
// to find out, and that is counted.
//
// A code is switched off rather than deleted. A spent campaign is the record of
// why a hundred orders were cheaper than the price list, and deleting the code
// deletes the reason.

type promoListInput struct {
	Limit int `query:"soni" minimum:"1" maximum:"200" default:"50"`
	Skip  int `query:"otkazish" minimum:"0" default:"0"`
}

type promoListOutput struct {
	Body admin.Page[admin.PromoCode]
}

type createPromoInput struct {
	Body admin.NewPromoCode
}

type promoOutput struct {
	Status int
	Body   struct {
		Code admin.PromoCode `json:"kod"`
	}
}

type promoActiveInput struct {
	Code string `path:"kod" pattern:"^[A-Za-z0-9-]{3,32}$"`
	Body struct {
		Faol bool `json:"faol"`
	}
}

func (s *Server) registerPromo(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "promokodlar",
		Method:      http.MethodGet,
		Path:        "/boshqaruv/promokodlar",
		Summary:     "Promokodlar",
		Tags:        []string{"boshqaruv"},
	}, func(ctx context.Context, in *promoListInput) (*promoListOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		page, err := s.admin.PromoCodesPage(ctx, int32(in.Limit), int32(in.Skip))
		if err != nil {
			return nil, internalError(err, "promokodlar o'qilmadi")
		}

		return &promoListOutput{Body: page}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "promokod-yaratish",
		Method:        http.MethodPost,
		Path:          "/boshqaruv/promokodlar",
		Summary:       "Yangi promokod",
		Tags:          []string{"boshqaruv"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *createPromoInput) (*promoOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		code, err := s.admin.CreatePromoCode(ctx, in.Body)
		switch {
		case errors.Is(err, admin.ErrTaken):
			return nil, huma.Error409Conflict("Bunday kod allaqachon bor.")
		case errors.Is(err, admin.ErrBadPromo):
			return nil, huma.Error422UnprocessableEntity(err.Error())
		case err != nil:
			return nil, internalError(err, "promokod yaratilmadi")
		}

		out := &promoOutput{Status: http.StatusCreated}
		out.Body.Code = code
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "promokodni-yoqish",
		Method:        http.MethodPut,
		Path:          "/boshqaruv/promokodlar/{kod}",
		Summary:       "Kodni yoqish yoki o'chirish",
		Description:   "O'chirilgan kod ishlamaydi, lekin qolgan — nima uchun chegirma berilganini u aytadi.",
		Tags:          []string{"boshqaruv"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *promoActiveInput) (*struct{}, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		if err := s.admin.SetPromoActive(ctx, in.Code, in.Body.Faol); err != nil {
			return nil, internalError(err, "kod holati o'zgarmadi")
		}
		return nil, nil
	})
}
