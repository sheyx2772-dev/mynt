package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/social"
)

// Kim ko'rdi, and the switch.
//
// The count is for every owner; the names are premium, and only for an owner
// who is not invisible — the same trade the network people arrive from makes.
// Enforced here, from the row, so a client that asks for names it is not
// entitled to gets the count and an empty list rather than a hidden field.

type viewersInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Limit int    `query:"soni" minimum:"1" maximum:"200" default:"50"`
}

type viewersOutput struct {
	Body struct {
		Viewers []social.Viewer `json:"korganlar"`
		// Distinct accounts in the last 30 days, whatever the plan.
		Count int64 `json:"soni"`
		// Why the list is empty when it is: bepul, korinmas, or ochiq.
		Reason string `json:"sabab" enum:"ochiq,bepul,korinmas"`
	}
}

type invisibleOutput struct {
	Body struct {
		Invisible bool `json:"korinmas"`
	}
}

type invisibleInput struct {
	Body struct {
		Invisible bool `json:"korinmas"`
	}
}

func (s *Server) registerVisits(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "korganlar",
		Method:      http.MethodGet,
		Path:        "/raqamlar/{raqam}/korganlar",
		Summary:     "Profilni kim ko'rgani",
		Description: "Soni hammaga; ismlar premium rejada va faqat o'zi ko'rinmas bo'lmagan egaga.",
		Tags:        []string{"statistika"},
	}, func(ctx context.Context, in *viewersInput) (*viewersOutput, error) {
		account, normalized, err := s.ownedNumber(ctx, in.Raqam)
		if err != nil {
			return nil, err
		}

		out := &viewersOutput{}
		out.Body.Count = s.social.CountViewers(ctx, normalized, account.ID, 30)
		out.Body.Viewers = []social.Viewer{}
		out.Body.Reason = "ochiq"

		owned, err := s.handles.Owned(ctx, normalized, account.ID)
		if err != nil {
			return nil, internalError(err, "raqam o'qilmadi")
		}
		if owned.Plan != handles.PlanPremium {
			out.Body.Reason = "bepul"
			return out, nil
		}
		if s.social.Invisible(ctx, account.ID) {
			out.Body.Reason = "korinmas"
			return out, nil
		}

		list, err := s.social.Viewers(ctx, normalized, account.ID, int32(in.Limit))
		if err != nil {
			return nil, internalError(err, "ko'rganlar o'qilmadi")
		}
		out.Body.Viewers = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "korinmas",
		Method:      http.MethodGet,
		Path:        "/men/korinmas",
		Summary:     "Ko'rinmas rejim holati",
		Tags:        []string{"kirish"},
	}, func(ctx context.Context, _ *struct{}) (*invisibleOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		out := &invisibleOutput{}
		out.Body.Invisible = s.social.Invisible(ctx, account.ID)
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "korinmas-qilish",
		Method:        http.MethodPut,
		Path:          "/men/korinmas",
		Summary:       "Ko'rinmas rejimni yoqish yoki o'chirish",
		Description:   "Yoqilsa siz ochgan profillar egalari sizni ko'rmaydi — va siz ham o'zingiznikini kim ko'rganini ko'rmaysiz. Avval yozilganlar o'chiriladi.",
		Tags:          []string{"kirish"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *invisibleInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		if err := s.social.SetInvisible(ctx, account.ID, in.Body.Invisible); err != nil {
			return nil, internalError(err, "sozlama saqlanmadi")
		}
		return nil, nil
	})
}
