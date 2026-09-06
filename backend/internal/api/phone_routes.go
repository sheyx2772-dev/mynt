package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/auth"
)

// The phone door, which is the app's front one.
//
// Click, Uzum and Payme all sign people in by phone here, and an ordinary buyer
// does not check email — so the app asks for a number. The link and the
// password stay: an SMS that does not arrive must not be a locked door, and in
// this market SMS not arriving is ordinary rather than exceptional.

type phoneInput struct {
	Body struct {
		Telefon string `json:"telefon" maxLength:"20" example:"+998 90 123 45 67"`
	}
}

type phoneCodeInput struct {
	Body struct {
		Telefon string `json:"telefon" maxLength:"20"`
		Kod     string `json:"kod" minLength:"6" maxLength:"6" pattern:"^[0-9]{6}$"`
	}
}

type phoneSentOutput struct {
	Status int
	Body   struct {
		Message string `json:"message"`
		// Only ever set by a development server with no SMS provider, so the
		// app can be signed into before an Eskiz account exists. Absent
		// everywhere else, including a development server that can really
		// send — the moment SMS works, this stops.
		Kod string `json:"kod,omitempty" doc:"Faqat ishlab chiqish rejimida"`
	}
}

func (s *Server) registerPhone(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID:   "telefon-kod",
		Method:        http.MethodPost,
		Path:          "/kirish/telefon",
		Summary:       "Raqamga kod yuborish",
		Description:   "Kod 5 daqiqa amal qiladi va uch marta xato kiritilsa kuchini yo'qotadi.",
		Tags:          []string{"kirish"},
		DefaultStatus: http.StatusAccepted,
	}, func(ctx context.Context, in *phoneInput) (*phoneSentOutput, error) {
		code, err := s.auth.RequestPhoneCode(ctx, in.Body.Telefon, requestFrom(ctx).IP)
		if errors.Is(err, auth.ErrBadPhone) {
			return nil, huma.Error422UnprocessableEntity("Telefon raqam noto'g'ri.")
		}
		if err != nil {
			return nil, internalError(err, "kod yuborilmadi")
		}

		// The same answer whether a code went out or the number was refused for
		// rate limiting. Anything else is a way of asking whether a number has
		// an account here.
		out := &phoneSentOutput{Status: http.StatusAccepted}
		out.Body.Message = "Kod yuborildi."

		// If no SMS provider is configured (e.g. staging or dev), return the code
		// so the product can be signed into and tested.
		if !s.cfg.SMSConfigured() || s.cfg.IsDevelopment() {
			out.Body.Kod = code
		}
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "telefon-tasdiq",
		Method:      http.MethodPost,
		Path:        "/kirish/telefon/tasdiq",
		Summary:     "Kodni kiritib, sessiya olish",
		Tags:        []string{"kirish"},
	}, func(ctx context.Context, in *phoneCodeInput) (*sessionOutput, error) {
		info := requestFrom(ctx)

		token, account, err := s.auth.VerifyPhoneCode(ctx, in.Body.Telefon, in.Body.Kod, info.UserAgent, info.IP)
		switch {
		case errors.Is(err, auth.ErrBadPhone):
			return nil, huma.Error422UnprocessableEntity("Telefon raqam noto'g'ri.")
		case errors.Is(err, auth.ErrBadCode):
			// One message for wrong, expired, used and guessed-out. Telling
			// them apart tells somebody guessing which half was right.
			return nil, huma.Error401Unauthorized("Kod noto'g'ri yoki eskirgan.")
		case err != nil:
			return nil, internalError(err, "kod tekshirilmadi")
		}

		out := &sessionOutput{SetCookie: s.sessionCookieFor(token)}
		out.Body.Token = token
		out.Body.Account = accountBody{ID: account.ID, Email: account.Email}
		return out, nil
	})
}
