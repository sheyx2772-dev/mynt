package api

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/notify"
	"github.com/sheyx2772-dev/flex/backend/internal/orders"
)

// Ordering the card, the ring or the bracelet, and following it to the door.
//
// Two audiences on one table. A buyer sees their own orders and writes the
// address on one of them; the operator sees the queue and moves things along.
// The split is not a convention about paths — every read here filters by the
// account, and every operator route goes through `requireOperator`.

type devicesOutput struct {
	Body struct {
		Orders []orders.Device `json:"buyurtmalar"`
	}
}

type deviceOutput struct {
	Body struct {
		Order orders.Device `json:"buyurtma"`
	}
}

type placeDeviceInput struct {
	Body struct {
		Handle string `json:"raqam" pattern:"^[a-z]{3}[0-9]{3}$" example:"aaa777"`
		// What to make. The price of each is on this side; nothing about money
		// arrives in this body.
		Type string `json:"qurilma" enum:"card,ring,bracelet"`
		// Which design to print. Optional, because a ring has none.
		Design string `json:"dizayn,omitempty" maxLength:"40"`
	}
}

type deviceIDInput struct {
	ID string `path:"id" format:"uuid"`
}

type deliveryInput struct {
	ID   string `path:"id" format:"uuid"`
	Body orders.Delivery
}

type advanceInput struct {
	ID   string `path:"id" format:"uuid"`
	Body struct {
		To string `json:"bosqich" enum:"queued,making,shipped,delivered,returned"`
	}
}

type queueOutput struct {
	Body struct {
		Orders []orders.Device `json:"buyurtmalar"`
		Total  int64           `json:"jami"`
	}
}

// requireOperator is the door to the queue.
//
// A 404 rather than a 403, for the same reason ownership checks 404: a reply
// that says "forbidden" has confirmed the thing exists. An unset
// OPERATOR_USER_ID closes the door — a deployment that has not been told who
// the operator is must not decide that everybody is.
func (s *Server) requireOperator(ctx context.Context) error {
	account, err := requireAccount(ctx)
	if err != nil {
		return err
	}
	if s.cfg.OperatorUserID == "" || account.ID != s.cfg.OperatorUserID {
		return huma.Error404NotFound("Topilmadi.")
	}
	return nil
}

// tellOperator raises a notice about a device order.
//
// Loud rather than silent when nobody is named: a sale nobody is told about is
// the bug this exists to prevent, and a deployment missing the setting would
// otherwise reproduce it exactly.
func (s *Server) tellOperator(ctx context.Context, title, body, handle string) {
	if s.cfg.OperatorUserID == "" {
		return
	}
	s.notify.Send(ctx, notify.Notice{
		UserID: s.cfg.OperatorUserID,
		Kind:   notify.KindDeviceOrder,
		Handle: handle,
		Title:  title,
		Body:   body,
		Href:   "/kabinet/buyurtmalar",
	})
}

func (s *Server) registerDevices(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "qurilma-buyurtmalarim",
		Method:      http.MethodGet,
		Path:        "/qurilmalar",
		Summary:     "O'z qurilma buyurtmalarim",
		Tags:        []string{"qurilma"},
	}, func(ctx context.Context, _ *struct{}) (*devicesOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		list, err := s.orders.Devices(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "buyurtmalar o'qilmadi")
		}

		out := &devicesOutput{}
		out.Body.Orders = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "qurilma-buyurtma-ochish",
		Method:        http.MethodPost,
		Path:          "/qurilmalar",
		Summary:       "Qurilmaga buyurtma ochish",
		Description:   "Raqam allaqachon sizniki bo'lishi kerak. Narx shu yerda hisoblanadi.",
		Tags:          []string{"qurilma"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *placeDeviceInput) (*deviceOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		order, err := s.orders.PlaceDevice(ctx, account.ID, in.Body.Handle, in.Body.Type, in.Body.Design)
		switch {
		case errors.Is(err, orders.ErrUnknownDevice):
			return nil, huma.Error422UnprocessableEntity("Bunday qurilma yo'q.")
		case errors.Is(err, orders.ErrNotFound):
			// Not theirs, or no such number. One answer for both.
			return nil, huma.Error404NotFound("Bu raqam sizniki emas.")
		case err != nil:
			return nil, internalError(err, "buyurtma ochilmadi")
		}

		out := &deviceOutput{}
		out.Body.Order = order
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "qurilma-buyurtma",
		Method:      http.MethodGet,
		Path:        "/qurilmalar/{id}",
		Summary:     "Bitta buyurtma",
		Tags:        []string{"qurilma"},
	}, func(ctx context.Context, in *deviceIDInput) (*deviceOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		order, err := s.orders.Device(ctx, in.ID, account.ID)
		if errors.Is(err, orders.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "buyurtma o'qilmadi")
		}

		out := &deviceOutput{}
		out.Body.Order = order
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "qurilma-manzil",
		Method:      http.MethodPut,
		Path:        "/qurilmalar/{id}/manzil",
		Summary:     "Yetkazish manzilini yozish",
		Description: "To'langan buyurtmaga manzil yozilgach, u navbatga tushadi.",
		Tags:        []string{"qurilma"},
	}, func(ctx context.Context, in *deliveryInput) (*deviceOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		order, err := s.orders.SetDelivery(ctx, in.ID, account.ID, in.Body)
		if errors.Is(err, orders.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "manzil yozilmadi")
		}

		s.tellOperator(ctx,
			fmt.Sprintf("Manzil keldi — %s", order.Handle),
			fmt.Sprintf("%s · %s, %s", order.DeviceType, order.Region, order.Address),
			order.Handle)

		out := &deviceOutput{}
		out.Body.Order = order
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "qurilma-tolash",
		Method:      http.MethodPost,
		Path:        "/qurilmalar/{id}/tolash",
		Summary:     "To'lov tizimisiz to'lash",
		Description: "Faqat provayder ulanmagan muhitda ishlaydi.",
		Tags:        []string{"qurilma"},
	}, func(ctx context.Context, in *deviceIDInput) (*deviceOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		order, err := s.orders.SettleDevice(ctx, in.ID, account.ID)
		switch {
		case errors.Is(err, orders.ErrCannotSell):
			return nil, huma.Error503ServiceUnavailable("To'lov tizimi hozir ishlamayapti.")
		case errors.Is(err, orders.ErrNotFound):
			return nil, huma.Error404NotFound("Topilmadi.")
		case err != nil:
			return nil, internalError(err, "to'lov yozilmadi")
		}

		s.tellOperator(ctx,
			fmt.Sprintf("Qurilma sotildi — %s", order.Handle),
			fmt.Sprintf("%s · manzil kutilmoqda", order.DeviceType),
			order.Handle)

		out := &deviceOutput{}
		out.Body.Order = order
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "qurilma-navbati",
		Method:      http.MethodGet,
		Path:        "/navbat",
		Summary:     "Yasash navbati",
		Description: "Faqat operator uchun.",
		Tags:        []string{"qurilma"},
	}, func(ctx context.Context, _ *struct{}) (*queueOutput, error) {
		if err := s.requireOperator(ctx); err != nil {
			return nil, err
		}

		list, err := s.orders.Queue(ctx)
		if err != nil {
			return nil, internalError(err, "navbat o'qilmadi")
		}
		total, err := s.orders.QueueSize(ctx)
		if err != nil {
			return nil, internalError(err, "navbat sanalmadi")
		}

		out := &queueOutput{}
		out.Body.Orders = list
		out.Body.Total = total
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "qurilma-bosqich",
		Method:      http.MethodPost,
		Path:        "/navbat/{id}/bosqich",
		Summary:     "Buyurtmani keyingi bosqichga o'tkazish",
		Description: "Faqat operator uchun. Ruxsat etilgan qadamlar shu yerda tekshiriladi.",
		Tags:        []string{"qurilma"},
	}, func(ctx context.Context, in *advanceInput) (*deviceOutput, error) {
		if err := s.requireOperator(ctx); err != nil {
			return nil, err
		}

		order, err := s.orders.Advance(ctx, in.ID, in.Body.To)
		switch {
		case errors.Is(err, orders.ErrNotFound):
			return nil, huma.Error404NotFound("Topilmadi.")
		case errors.Is(err, orders.ErrWrongState):
			return nil, huma.Error409Conflict("Bu qadam mumkin emas.")
		case err != nil:
			return nil, internalError(err, "bosqich o'zgarmadi")
		}

		out := &deviceOutput{}
		out.Body.Order = order
		return out, nil
	})
}
