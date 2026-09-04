package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/auth"
)

// Signing in is three requests: ask for a link, spend it, and afterwards say
// who you are. Signing out is a fourth.
//
// There is no password anywhere in this file, and there is no registration
// step either. Following a link sent to an address proves the address, which
// is the only thing a password would have been standing in for — and an
// account that cannot have its password reused elsewhere, guessed, or phished
// out of somebody is worth more than the convenience of one.

type requestLinkInput struct {
	Body struct {
		Email string `json:"email" maxLength:"254" doc:"Kirish havolasi yuboriladigan manzil"`
	}
}

type requestLinkOutput struct {
	Status int
	Body   struct {
		Message string `json:"message"`
	}
}

type confirmLinkInput struct {
	Body struct {
		Token string `json:"token" minLength:"20" maxLength:"200" doc:"Xatdagi havoladan olingan token"`
	}
}

type sessionOutput struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
	Body      struct {
		// The same session the cookie carries, for a client that has no cookie
		// jar. The website ignores this field and uses the cookie; the phone
		// stores this and sends it as a bearer.
		Token   string      `json:"token" doc:"Sessiya kaliti — faqat mobil ilova uchun"`
		Account accountBody `json:"account"`
	}
}

type accountBody struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type meOutput struct {
	Body struct {
		Account accountBody `json:"account"`
	}
}

type signOutOutput struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
	Status    int
}

func (s *Server) registerAuth(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID:   "kirish-sorash",
		Method:        http.MethodPost,
		Path:          "/kirish",
		Summary:       "Kirish havolasini so'rash",
		Description:   "Manzilga bir martalik havola yuboradi. Javob har doim bir xil.",
		Tags:          []string{"kirish"},
		DefaultStatus: http.StatusAccepted,
	}, func(ctx context.Context, in *requestLinkInput) (*requestLinkOutput, error) {
		err := s.auth.RequestLink(ctx, in.Body.Email, requestFrom(ctx).IP)
		if errors.Is(err, auth.ErrInvalidEmail) {
			return nil, huma.Error422UnprocessableEntity("Email manzil noto'g'ri.")
		}
		if err != nil {
			return nil, internalError(err, "havola yuborilmadi")
		}

		// The same answer whether an account exists, whether one was just
		// rate-limited, and whether a link actually went out. Anything else
		// turns this endpoint into a way of asking whether somebody is a
		// customer here.
		out := &requestLinkOutput{Status: http.StatusAccepted}
		out.Body.Message = "Agar bu manzil to'g'ri bo'lsa, havola yuborildi."
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "kirish-tasdiqlash",
		Method:      http.MethodPost,
		Path:        "/kirish/tasdiq",
		Summary:     "Havolani sarflab, sessiya olish",
		Description: "Havola bir marta ishlaydi va 15 daqiqadan keyin kuchini yo'qotadi.",
		Tags:        []string{"kirish"},
	}, func(ctx context.Context, in *confirmLinkInput) (*sessionOutput, error) {
		info := requestFrom(ctx)

		token, account, err := s.auth.ConsumeLink(ctx, in.Body.Token, info.UserAgent, info.IP)
		if errors.Is(err, auth.ErrBadToken) {
			// One message for expired, spent and never-existed. Telling them
			// apart tells somebody holding a guess which half was right.
			return nil, huma.Error401Unauthorized("Havola eskirgan yoki allaqachon ishlatilgan.")
		}
		if err != nil {
			return nil, internalError(err, "sessiya ochilmadi")
		}

		out := &sessionOutput{SetCookie: s.sessionCookieFor(token)}
		out.Body.Token = token
		out.Body.Account = accountBody{ID: account.ID, Email: account.Email}
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "men",
		Method:      http.MethodGet,
		Path:        "/men",
		Summary:     "Hozir kim kirgan",
		Tags:        []string{"kirish"},
	}, func(ctx context.Context, _ *struct{}) (*meOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		out := &meOutput{}
		out.Body.Account = accountBody{ID: account.ID, Email: account.Email}
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "chiqish",
		Method:        http.MethodPost,
		Path:          "/chiqish",
		Summary:       "Shu qurilmadan chiqish",
		Description:   "Boshqa qurilmalardagi sessiyalarga tegmaydi.",
		Tags:          []string{"kirish"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, _ *struct{}) (*signOutOutput, error) {
		// Deliberately not an error when there was nothing to end. Signing out
		// of a session that already expired is a person pressing the button
		// they expected to be there, and it should do what they meant.
		if err := s.auth.SignOut(ctx, requestFrom(ctx).Token); err != nil {
			return nil, internalError(err, "chiqib bo'lmadi")
		}

		return &signOutOutput{
			SetCookie: s.expiredSessionCookie(),
			Status:    http.StatusNoContent,
		}, nil
	})
}
