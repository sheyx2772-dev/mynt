package api

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/leads"
	"github.com/sheyx2772-dev/flex/backend/internal/notify"
)

// Contacts left on a profile.
//
// One of these routes needs no account, which makes it the most exposed thing
// in the API: anybody may post to it, on behalf of a number they do not own.
// What protects it is that nothing it writes is trusted — see internal/leads —
// and that it is counted twice before it writes anything at all.

type leaveLeadInput struct {
	Raqam string      `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$" example:"MYN042"`
	Body  leads.Input `json:"body"`
}

type leaveLeadOutput struct {
	Status int
	Body   struct {
		Message string `json:"message"`
	}
}

type leadListOutput struct {
	Body struct {
		Leads []leads.Lead `json:"vizitkalar"`
	}
}

type deleteLeadInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	ID    int64  `path:"id" minimum:"1"`
}

func (s *Server) registerLeads(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID:   "vizitka-qoldirish",
		Method:        http.MethodPost,
		Path:          "/profil/{raqam}/vizitka",
		Summary:       "Profilga kontakt qoldirish",
		Description:   "Hisob talab qilinmaydi — bu kartani tegizgan odam to'ldiradigan forma.",
		Tags:          []string{"vizitkalar"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *leaveLeadInput) (*leaveLeadOutput, error) {
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		problem, err := s.leads.Leave(ctx, parsed.Normalized(), in.Body, requestFrom(ctx).IP)
		switch {
		case problem != "":
			return nil, huma.Error422UnprocessableEntity(problem)
		case errors.Is(err, leads.ErrTooMany):
			// Said plainly. Unlike a sign-in link there is nothing to disclose
			// here: the profile is public, and somebody who typed their number
			// into a form knows they typed it.
			return nil, huma.Error429TooManyRequests("Juda ko'p urinish. Biroz kutib, qayta yuboring.")
		case errors.Is(err, leads.ErrNoHandle):
			return nil, huma.Error404NotFound("Bu profil topilmadi.")
		case err != nil:
			return nil, internalError(err, "vizitka yozilmadi")
		}

		// The owner hears about it now rather than the next time they open the
		// cabinet — a contact is worth money for about as long as the meeting
		// is still fresh. Off the visitor's own wait: they have done their part
		// and should see the confirmation immediately, and whether somebody
		// else's Telegram answered in time is not their problem.
		if owner := s.leads.Owner(ctx, parsed.Normalized()); owner != "" {
			go s.notify.Send(context.WithoutCancel(ctx), notify.Notice{
				UserID: owner,
				Kind:   notify.KindLead,
				Handle: parsed.Normalized(),
				Title:  in.Body.Name + " kontaktini qoldirdi",
				Body:   details(in.Body),
				Href:   "/kabinet/" + parsed.Normalized(),
			})
		}

		out := &leaveLeadOutput{Status: http.StatusCreated}
		out.Body.Message = "Yuborildi. Rahmat."
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "vizitkalar",
		Method:      http.MethodGet,
		Path:        "/raqamlar/{raqam}/vizitkalar",
		Summary:     "Raqamga qoldirilgan kontaktlar",
		Tags:        []string{"vizitkalar"},
	}, func(ctx context.Context, in *handlePathInput) (*leadListOutput, error) {
		account, normalized, err := s.ownedNumber(ctx, in.Raqam)
		if err != nil {
			return nil, err
		}

		list, err := s.leads.ForOwner(ctx, normalized, account.ID)
		if err != nil {
			return nil, internalError(err, "vizitkalar o'qilmadi")
		}

		out := &leadListOutput{}
		out.Body.Leads = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "vizitkani-ochirish",
		Method:        http.MethodDelete,
		Path:          "/raqamlar/{raqam}/vizitkalar/{id}",
		Summary:       "Bitta kontaktni o'chirish",
		Description:   "Odam o'z ma'lumotini olib tashlashni so'rashi mumkin, va egasi buni qila olishi kerak.",
		Tags:          []string{"vizitkalar"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *deleteLeadInput) (*struct{}, error) {
		account, normalized, err := s.ownedNumber(ctx, in.Raqam)
		if err != nil {
			return nil, err
		}

		if err := s.leads.Delete(ctx, normalized, account.ID, in.ID); err != nil {
			if errors.Is(err, leads.ErrNoHandle) {
				return nil, huma.Error404NotFound("Topilmadi.")
			}
			return nil, internalError(err, "vizitka o'chirilmadi")
		}

		return nil, nil
	})
}

// details is the one line under the name: whatever they left, in the order
// somebody would read it.
func details(in leads.Input) string {
	parts := make([]string, 0, 4)
	for _, field := range []string{in.Phone, in.Email, in.Company, in.Note} {
		if field != "" {
			parts = append(parts, field)
		}
	}
	return strings.Join(parts, " · ")
}
