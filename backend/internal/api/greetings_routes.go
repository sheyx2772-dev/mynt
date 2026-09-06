package api

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/notify"
	"github.com/sheyx2772-dev/flex/backend/internal/social"
)

// Tug'ilgan kun tabriklari — read by anyone, left by anyone signed in, in the
// week of the day and not otherwise.

type greetingsInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Limit int    `query:"soni" minimum:"1" maximum:"200" default:"60"`
}

type greetingsOutput struct {
	Body struct {
		Greetings []social.Greeting `json:"tabriklar"`
		Soni      int64             `json:"soni"`
	}
}

type greetInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Emoji string `json:"emoji" minLength:"1" maxLength:"8"`
		Matn  string `json:"matn,omitempty" maxLength:"140"`
	}
}

func (s *Server) registerGreetings(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "tabriklar",
		Method:      http.MethodGet,
		Path:        "/profil/{raqam}/tabriklar",
		Summary:     "Tug'ilgan kun tabriklari",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *greetingsInput) (*greetingsOutput, error) {
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}
		viewer, _ := accountFrom(ctx)

		list, count, err := s.social.Greetings(ctx, raqam, viewer.ID, int32(in.Limit))
		if err != nil {
			return nil, internalError(err, "tabriklar o'qilmadi")
		}
		out := &greetingsOutput{}
		out.Body.Greetings = list
		out.Body.Soni = count
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "tabriklash",
		Method:        http.MethodPost,
		Path:          "/profil/{raqam}/tabriklar",
		Summary:       "Tug'ilgan kun bilan tabriklash",
		Description:   "Faqat tug'ilgan kun haftasida. Bir kishi yiliga bir marta; qayta yuborilsa avvalgisi o'zgaradi.",
		Tags:          []string{"profil"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *greetInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		greeted, err := s.social.Greet(ctx, raqam, account.ID, strings.TrimSpace(in.Body.Emoji), strings.TrimSpace(in.Body.Matn))
		if errors.Is(err, social.ErrNotBirthday) {
			return nil, huma.Error409Conflict("Tabrik faqat tug'ilgan kun haftasida qabul qilinadi.")
		}
		if err != nil {
			return nil, internalError(err, "tabrik yozilmadi")
		}

		// Told once, when the greeting is new. The owner greeting themselves
		// is a test, not news.
		if greeted.Fresh && greeted.OwnerID != "" && greeted.OwnerID != account.ID {
			body := in.Body.Emoji
			if in.Body.Matn != "" {
				body += " " + in.Body.Matn
			}
			go s.notify.Send(context.WithoutCancel(ctx), notify.Notice{
				UserID: greeted.OwnerID,
				Kind:   notify.KindGreeting,
				Handle: raqam,
				Title:  "Tug'ilgan kuningiz bilan tabrik keldi",
				Body:   body,
				Href:   "/" + raqam,
			})
		}
		return nil, nil
	})
}
