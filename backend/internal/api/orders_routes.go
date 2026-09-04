package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/orders"
)

// Buying a number.
//
// Checking one is public: the whole point of the product is that somebody can
// try `AAA777` and be told what it costs. Buying is not, and the price is
// computed from the number on this side of the wire — a price that arrives with
// an order is a price the buyer chose.
//
// Nothing here takes money. The providers call back to the website's own
// endpoints, which are the ones registered in the merchant cabinets and tested
// against Payme's sandbox certification; a second implementation answering for
// the same merchant account would be a second place for money to be wrong.

type checkInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$" example:"AAA777"`
}

type checkOutput struct {
	Body orders.State
}

type buyInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$" example:"AAA777"`
	Body  struct {
		// The name on the card. Everything else about the profile is edited
		// afterwards; asking for fourteen fields before somebody has paid is
		// how a purchase gets abandoned.
		Name string `json:"ism" maxLength:"80"`
	}
}

type orderOutput struct {
	Body struct {
		Order orders.Order `json:"buyurtma"`
	}
}

type orderInput struct {
	ID string `path:"id" format:"uuid"`
}

func (s *Server) registerOrders(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "raqamni-tekshirish",
		Method:      http.MethodGet,
		Path:        "/qidirish/{raqam}",
		Summary:     "Raqam boshmi va qancha turadi",
		Description: "Hisob talab qilinmaydi — bu qidiruv.",
		Tags:        []string{"sotib olish"},
	}, func(ctx context.Context, in *checkInput) (*checkOutput, error) {
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		state, err := s.orders.Check(ctx, parsed)
		if err != nil {
			return nil, internalError(err, "raqam tekshirilmadi")
		}

		return &checkOutput{Body: state}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "raqamni-band-qilish",
		Method:        http.MethodPost,
		Path:          "/qidirish/{raqam}/olish",
		Summary:       "Raqamni band qilib, buyurtma ochish",
		Description:   "Raqam 30 daqiqaga band qilinadi va to'lov tasdiqlangach egangizga o'tadi.",
		Tags:          []string{"sotib olish"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *buyInput) (*orderOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		order, err := s.orders.Buy(ctx, parsed, account.ID, in.Body.Name, requestFrom(ctx).IP)
		switch {
		case errors.Is(err, orders.ErrTaken):
			// The race being lost and a number sold last week are one message,
			// because the buyer does the same thing either way.
			return nil, huma.Error409Conflict("Bu raqam allaqachon band qilingan.")
		case errors.Is(err, orders.ErrCannotSell):
			// A production deployment with no provider configured. Refusing is
			// the safe direction: the alternative was handing over a number
			// worth millions because a variable was missing.
			return nil, huma.Error503ServiceUnavailable("To'lov tizimi hozir ishlamayapti. Keyinroq urinib ko'ring.")
		case errors.Is(err, orders.ErrRateLimited):
			return nil, huma.Error429TooManyRequests("Bir soatda juda ko'p urinish. Birozdan so'ng qayta urining.")
		case err != nil:
			return nil, internalError(err, "buyurtma ochilmadi")
		}

		out := &orderOutput{}
		out.Body.Order = order
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "buyurtma",
		Method:      http.MethodGet,
		Path:        "/buyurtmalar/{id}",
		Summary:     "Buyurtma holati",
		Description: "To'lovdan keyin shu yerdan tekshiriladi.",
		Tags:        []string{"sotib olish"},
	}, func(ctx context.Context, in *orderInput) (*orderOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		order, err := s.orders.Order(ctx, in.ID, account.ID)
		if errors.Is(err, orders.ErrNotFound) {
			// Somebody else's order and an invented one get the same answer.
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "buyurtma o'qilmadi")
		}

		out := &orderOutput{}
		out.Body.Order = order
		return out, nil
	})
}
