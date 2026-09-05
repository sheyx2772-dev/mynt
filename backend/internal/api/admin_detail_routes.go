package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/admin"
)

// One of a thing, rather than a page of them.
//
// The question the panel is asked about an order is "what happened to it", and
// the answer is spread across three tables — what was bought, what the
// providers recorded, and whether a code was used. One route rather than three
// screens somebody has to join up in their head.

func (s *Server) registerAdminDetail(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "boshqaruv-buyurtma",
		Method:      http.MethodGet,
		Path:        "/boshqaruv/buyurtmalar/{id}",
		Summary:     "Bitta buyurtma — to'liq",
		Description: "Kim, qachon, qancha, qaysi to'lov, qaysi promokod, va provayder nima yozgani.",
		Tags:        []string{"boshqaruv"},
	}, func(ctx context.Context, in *adminOrderInput) (*adminOrderOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		order, err := s.admin.Order(ctx, in.ID)
		if errors.Is(err, admin.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "buyurtma o'qilmadi")
		}

		out := &adminOrderOutput{}
		out.Body.Order = order
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "boshqaruv-hisoblar",
		Method:      http.MethodGet,
		Path:        "/boshqaruv/hisoblar",
		Summary:     "Mijozlar",
		Description: "Kim, nechta raqam, jami qancha to'lagan, oxirgi to'lov qachon.",
		Tags:        []string{"boshqaruv"},
	}, func(ctx context.Context, in *adminAccountsInput) (*adminAccountsOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		page, err := s.admin.AccountsPage(ctx, in.Term, admin.AccountSort(in.Sort, in.Descending), int32(in.Limit), int32(in.Skip))
		if err != nil {
			return nil, internalError(err, "hisoblar o'qilmadi")
		}

		return &adminAccountsOutput{Body: page}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "boshqaruv-hisob-buyurtmalari",
		Method:      http.MethodGet,
		Path:        "/boshqaruv/hisoblar/{id}/buyurtmalar",
		Summary:     "Bitta mijozning hamma buyurtmalari",
		Tags:        []string{"boshqaruv"},
	}, func(ctx context.Context, in *adminAccountInput) (*adminAccountOutput, error) {
		if _, err := s.requireAdmin(ctx); err != nil {
			return nil, err
		}

		orders, err := s.admin.AccountOrders(ctx, in.ID)
		if err != nil {
			return nil, internalError(err, "buyurtmalar o'qilmadi")
		}

		out := &adminAccountOutput{}
		out.Body.Orders = orders
		return out, nil
	})
}
