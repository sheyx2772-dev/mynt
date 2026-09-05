package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/admin"
	"github.com/sheyx2772-dev/flex/backend/internal/auth"
	"github.com/sheyx2772-dev/flex/backend/internal/handles"
)

// The panel.
//
// Everything here needs an address on the allow-list, checked by `requireAdmin`
// and nowhere else — a guard repeated in six handlers is a guard missing from
// the seventh. The list is empty by default, so a deployment that forgot the
// variable has no admin rather than an open one.
//
// A caller who is signed in but not on the list gets 404 rather than 403. 403
// says "this exists and you are not allowed", which is a map; 404 says nothing.

type overviewOutput struct {
	Body struct {
		Overview admin.Overview `json:"umumiy"`
	}
}

type adminOrdersInput struct {
	Status string `query:"holat" enum:"pending,paid,cancelled,failed" required:"false"`
	Limit  int    `query:"soni" minimum:"1" maximum:"200" default:"50"`
	Skip   int    `query:"otkazish" minimum:"0" default:"0"`
}

type adminOrdersOutput struct {
	Body admin.Page[admin.AdminOrder]
}

type adminOrderInput struct {
	ID string `path:"id" format:"uuid"`
}

type adminOrderOutput struct {
	Body struct {
		Order admin.OrderDetail `json:"buyurtma"`
	}
}

type adminHandlesInput struct {
	Term  string `query:"qidiruv" maxLength:"80" required:"false" doc:"Raqam, ism yoki egasining manzili"`
	Limit int    `query:"soni" minimum:"1" maximum:"200" default:"50"`
	Skip  int    `query:"otkazish" minimum:"0" default:"0"`
}

type adminHandlesOutput struct {
	Body admin.Page[admin.AdminHandle]
}

type adminAccountsInput struct {
	Term  string `query:"qidiruv" maxLength:"80" required:"false" doc:"Email yoki telefon"`
	Limit int    `query:"soni" minimum:"1" maximum:"200" default:"50"`
	Skip  int    `query:"otkazish" minimum:"0" default:"0"`
}

type adminAccountsOutput struct {
	Body admin.Page[admin.Account]
}

type adminAccountInput struct {
	ID string `path:"id" format:"uuid"`
}

type adminAccountOutput struct {
	Body struct {
		Orders []admin.AdminOrder `json:"buyurtmalar"`
	}
}

type giveInput struct {
	Body struct {
		Raqam  string `json:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$" example:"MYN042"`
		Email  string `json:"email" maxLength:"254" doc:"Qabul qiluvchining mavjud hisobi"`
		Ism    string `json:"ism,omitempty" maxLength:"80"`
		Sababi string `json:"sababi" minLength:"3" maxLength:"200" doc:"Nima uchun berildi — hisobotda qoladi"`
	}
}

type giveOutput struct {
	Status int
	Body   struct {
		Number string `json:"raqam"`
	}
}

func (s *Server) registerAdmin(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "boshqaruv-umumiy",
		Method:      http.MethodGet,
		Path:        "/boshqaruv/umumiy",
		Summary:     "Panelning bosh sahifasi",
		Tags:        []string{"boshqaruv"},
	}, func(ctx context.Context, _ *struct{}) (*overviewOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		overview, err := s.admin.Overview(ctx)
		if err != nil {
			return nil, internalError(err, "umumiy ma'lumot o'qilmadi")
		}

		out := &overviewOutput{}
		out.Body.Overview = overview
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "boshqaruv-buyurtmalar",
		Method:      http.MethodGet,
		Path:        "/boshqaruv/buyurtmalar",
		Summary:     "Buyurtmalar",
		Tags:        []string{"boshqaruv"},
	}, func(ctx context.Context, in *adminOrdersInput) (*adminOrdersOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		page, err := s.admin.OrdersPage(ctx, in.Status, int32(in.Limit), int32(in.Skip))
		if err != nil {
			return nil, internalError(err, "buyurtmalar o'qilmadi")
		}

		return &adminOrdersOutput{Body: page}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "boshqaruv-raqamlar",
		Method:      http.MethodGet,
		Path:        "/boshqaruv/raqamlar",
		Summary:     "Raqamlarni qidirish",
		Tags:        []string{"boshqaruv"},
	}, func(ctx context.Context, in *adminHandlesInput) (*adminHandlesOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		page, err := s.admin.HandlesPage(ctx, in.Term, int32(in.Limit), int32(in.Skip))
		if err != nil {
			return nil, internalError(err, "raqamlar o'qilmadi")
		}

		return &adminHandlesOutput{Body: page}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "boshqaruv-sovga",
		Method:        http.MethodPost,
		Path:          "/boshqaruv/sovga",
		Summary:       "Raqamni sotmasdan berish",
		Description:   "Sabab yoziladi va hisobotda qoladi. Sovg'a sotuvdek ko'rinsa, birinchi oy raqamlari yolg'on bo'ladi.",
		Tags:          []string{"boshqaruv"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *giveInput) (*giveOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		parsed, ok := handles.Parse(in.Body.Raqam)
		if !ok {
			return nil, huma.Error422UnprocessableEntity("Raqam formati noto'g'ri.")
		}

		number, err := s.admin.Give(ctx, parsed, in.Body.Email, in.Body.Ism, in.Body.Sababi)
		switch {
		case errors.Is(err, admin.ErrNoAccount):
			// Creating one here would mean sending somebody an account they did
			// not ask for.
			return nil, huma.Error422UnprocessableEntity("Bu manzilda hisob yo'q. Avval o'zi kirsin.")
		case errors.Is(err, admin.ErrTaken):
			return nil, huma.Error409Conflict("Bu raqam allaqachon band.")
		case err != nil:
			return nil, internalError(err, "raqam berilmadi")
		}

		out := &giveOutput{Status: http.StatusCreated}
		out.Body.Number = number
		return out, nil
	})
}

// requireAdmin is the door to the panel, and the only place it is decided.
func (s *Server) requireAdmin(ctx context.Context) (auth.Account, error) {
	account, err := requireAccount(ctx)
	if err != nil {
		return auth.Account{}, err
	}

	if !s.cfg.IsAdmin(account.Email) {
		// Not 403. "This exists and you are not allowed" is a map of what to
		// attack next; this says nothing at all.
		return auth.Account{}, huma.Error404NotFound("Topilmadi.")
	}

	return account, nil
}
