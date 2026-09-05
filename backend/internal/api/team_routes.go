package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/teams"
)

// A company, its numbers and its invoices.

type teamOutput struct {
	Body struct {
		Team    *teams.Team  `json:"jamoa"`
		Handles []teams.Seat `json:"raqamlar"`
		Stats   teams.Stats  `json:"hisob"`
	}
}

type teamHandleInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Kimga string `json:"kimga,omitempty" format:"email" maxLength:"120" doc:"Bo'sh bo'lsa — raqam qaytarib olinadi"`
	}
}

type teamInvoicesOutput struct {
	Body struct {
		Invoices []teams.TeamInvoice `json:"hisoblar"`
	}
}

type teamInvoiceOutput struct {
	Body struct {
		Invoice teams.TeamInvoice `json:"hisob"`
	}
}

type issueTeamInput struct {
	Body struct {
		Orinlar   int32 `json:"orinlar" minimum:"1" maximum:"10000"`
		Oylar     int32 `json:"oylar" minimum:"1" maximum:"24"`
		OrinOylik int64 `json:"orin_oylik" minimum:"0"`
		QqsFoizi  int32 `json:"qqs_foizi" minimum:"0" maximum:"30"`
		Jami      int64 `json:"jami" minimum:"0"`
	}
}

type requisitesInput struct {
	Body teams.Requisites
}

type teamRequestInput struct {
	Body teams.ContactRequest
}

func (s *Server) registerTeams(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "jamoam", Method: http.MethodGet, Path: "/men/jamoa",
		Summary:     "Jamoam, raqamlari va hisobi",
		Description: "Jamoasi yo'q hisob uchun null — bu odatiy holat.",
		Tags:        []string{"jamoa"},
	}, func(ctx context.Context, _ *struct{}) (*teamOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		out := &teamOutput{}
		team, err := s.teams.ForUser(ctx, account.ID)
		if errors.Is(err, teams.ErrNotFound) {
			return out, nil
		}
		if err != nil {
			return nil, internalError(err, "jamoa o'qilmadi")
		}

		id, _ := uuid.Parse(team.ID)
		list, err := s.teams.Seats(ctx, id)
		if err != nil {
			return nil, internalError(err, "raqamlar o'qilmadi")
		}
		stats, err := s.teams.Stats(ctx, id)
		if err != nil {
			return nil, internalError(err, "hisob o'qilmadi")
		}

		out.Body.Team = &team
		out.Body.Handles = list
		out.Body.Stats = stats
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "jamoa-raqami", Method: http.MethodPut,
		Path: "/jamoa/raqamlar/{raqam}", Summary: "Raqamni xodimga berish yoki qaytarib olish",
		Description: "Faqat jamoa egasi. Raqam kompaniyada qoladi — faqat kimdaligi o'zgaradi.",
		Tags:        []string{"jamoa"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *teamHandleInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		if in.Body.Kimga == "" {
			err = s.teams.Release(ctx, parsed.Normalized(), account.ID)
		} else {
			err = s.teams.Assign(ctx, parsed.Normalized(), account.ID, in.Body.Kimga)
		}

		switch {
		case errors.Is(err, teams.ErrNotFound):
			return nil, huma.Error404NotFound("Bu raqam firmangizga tegishli emas.")
		case errors.Is(err, teams.ErrOccupied):
			// Reassigning an occupied number silently would take somebody's
			// profile away without the wipe that offboarding does on purpose.
			return nil, huma.Error409Conflict("Raqam band. Avval uni bo'shating.")
		case errors.Is(err, teams.ErrNoSeats):
			return nil, huma.Error409Conflict("Bo'sh o'rin yo'q.")
		case err != nil:
			return nil, internalError(err, "raqam o'zgarmadi")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "jamoa-hisoblari", Method: http.MethodGet,
		Path: "/men/jamoa/hisoblar", Summary: "Jamoaning hisob-fakturalari",
		Tags: []string{"jamoa"},
	}, func(ctx context.Context, _ *struct{}) (*teamInvoicesOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		list, err := s.teams.Invoices(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "hisoblar o'qilmadi")
		}

		out := &teamInvoicesOutput{}
		out.Body.Invoices = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "jamoa-hisobi", Method: http.MethodGet,
		Path: "/jamoa/hisoblar/{id}", Summary: "Bitta hisob-faktura",
		Tags: []string{"jamoa"},
	}, func(ctx context.Context, in *idInput) (*teamInvoiceOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		invoice, err := s.teams.Invoice(ctx, id, account.ID)
		if errors.Is(err, teams.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "hisob o'qilmadi")
		}

		out := &teamInvoiceOutput{}
		out.Body.Invoice = invoice
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "jamoa-hisob-berish", Method: http.MethodPost,
		Path: "/men/jamoa/hisoblar", Summary: "Hisob-faktura chiqarish",
		Tags: []string{"jamoa"}, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *issueTeamInput) (*teamInvoiceOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		invoice, err := s.teams.Issue(ctx, account.ID, in.Body.Orinlar, in.Body.Oylar,
			in.Body.QqsFoizi, in.Body.OrinOylik, in.Body.Jami)
		if errors.Is(err, teams.ErrNotFound) {
			return nil, huma.Error403Forbidden("Faqat jamoa egasi chiqara oladi.")
		}
		if err != nil {
			return nil, internalError(err, "hisob berilmadi")
		}

		out := &teamInvoiceOutput{}
		out.Body.Invoice = invoice
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "jamoa-rekvizitlari", Method: http.MethodPut,
		Path: "/men/jamoa/rekvizitlar", Summary: "Hisob-fakturaga chiqadigan ma'lumotlar",
		Description: "Faqat jamoa egasi: birovning bank hisobi yozilgan hisob-faktura — bizning nomimiz bilan qilingan firibgarlik.",
		Tags:        []string{"jamoa"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *requisitesInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		err = s.teams.SaveRequisites(ctx, account.ID, in.Body)
		if errors.Is(err, teams.ErrNotFound) {
			return nil, huma.Error403Forbidden("Faqat jamoa egasi o'zgartira oladi.")
		}
		if err != nil {
			return nil, internalError(err, "saqlanmadi")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "jamoa-sorovi", Method: http.MethodPost, Path: "/jamoa/sorov",
		Summary:     "Kompaniya bog'lanishni so'raydi",
		Description: "Sessiya kerak emas — hali ro'yxatdan o'tmagan kompaniya to'ldiradi.",
		Tags:        []string{"jamoa"}, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *teamRequestInput) (*struct{}, error) {
		if err := s.teams.AskToBeContacted(ctx, in.Body); err != nil {
			return nil, internalError(err, "so'rov yozilmadi")
		}
		return nil, nil
	})
}
