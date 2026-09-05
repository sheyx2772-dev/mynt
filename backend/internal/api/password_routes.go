package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/auth"
)

// The password door.
//
// Faster than waiting for mail, for the handful of people who open the panel
// every day. The link stays and is still how an account is created and how one
// is recovered — a forgotten password must not be a locked door, and the link
// already is the reset flow, so there is no second one to get wrong.

type passwordInput struct {
	Body struct {
		Email string `json:"email" maxLength:"254"`
		Parol string `json:"parol" maxLength:"200"`
	}
}

type setPasswordInput struct {
	Body struct {
		Parol string `json:"parol" minLength:"10" maxLength:"200" doc:"Kamida 10 ta belgi"`
	}
}

func (s *Server) registerPassword(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "kirish-parol",
		Method:      http.MethodPost,
		Path:        "/kirish/parol",
		Summary:     "Email va parol bilan kirish",
		Description: "Parolni o'rnatish uchun avval havola bilan kirib, keyin uni belgilang.",
		Tags:        []string{"kirish"},
	}, func(ctx context.Context, in *passwordInput) (*sessionOutput, error) {
		info := requestFrom(ctx)

		token, account, err := s.auth.SignInWithPassword(ctx, in.Body.Email, in.Body.Parol, info.UserAgent, info.IP)
		switch {
		case errors.Is(err, auth.ErrBadPassword):
			// One message for "no such account", "no password set" and "wrong
			// password". Telling them apart tells somebody which addresses have
			// accounts here.
			return nil, huma.Error401Unauthorized("Email yoki parol noto'g'ri.")
		case errors.Is(err, auth.ErrRateLimited):
			// Said plainly, unlike the link. Somebody typing a password knows
			// they typed it, so there is nothing to disclose.
			return nil, huma.Error429TooManyRequests("Juda ko'p urinish. Bir soatdan keyin qayta urining yoki havola bilan kiring.")
		case err != nil:
			return nil, internalError(err, "kirib bo'lmadi")
		}

		out := &sessionOutput{SetCookie: s.sessionCookieFor(token)}
		out.Body.Token = token
		out.Body.Account = accountBody{ID: account.ID, Email: account.Email}
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "parolni-belgilash",
		Method:        http.MethodPut,
		Path:          "/men/parol",
		Summary:       "O'z parolini belgilash yoki almashtirish",
		Description:   "Kirgan holda. Parolni unutgan bo'lsangiz \u2014 havola bilan kiring va shu yerdan yangisini qo'ying.",
		Tags:          []string{"kirish"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *setPasswordInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		if err := s.auth.SetPassword(ctx, account.ID, in.Body.Parol); err != nil {
			if errors.Is(err, auth.ErrPasswordTooShort) {
				return nil, huma.Error422UnprocessableEntity(err.Error())
			}
			return nil, internalError(err, "parol saqlanmadi")
		}

		return nil, nil
	})

}
