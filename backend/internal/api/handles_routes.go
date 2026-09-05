package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/auth"
	"github.com/sheyx2772-dev/flex/backend/internal/handles"
)

// The numbers an account owns, and the profile on each.
//
// Every path takes the number as a parameter, which is to say from the client,
// which is to say it means nothing until it has been read back out of the
// database under the caller's own id. `owned` below is where that happens and
// every handler in this file starts by calling it.

type handleListOutput struct {
	Body struct {
		Handles []handles.Handle `json:"raqamlar"`
	}
}

type handlePathInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$" example:"MYN042" doc:"Uch harf va uch raqam"`
}

type handleOutput struct {
	Body struct {
		Handle handles.Handle `json:"raqam"`
	}
}

type saveProfileInput struct {
	Raqam string               `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$" example:"MYN042"`
	Body  handles.ProfileInput `json:"body"`
}

func (s *Server) registerHandles(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID:   "faollik",
		Method:        http.MethodPost,
		Path:          "/men/faollik",
		Summary:       "Raqamlarni faol deb belgilash",
		Description:   "Kabinet ochilganda chaqiriladi. Profilda \"oxirgi faollik\" shundan.",
		Tags:          []string{"raqamlar"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, _ *struct{}) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		if err := s.handles.TouchLastSeen(ctx, account.ID); err != nil {
			return nil, internalError(err, "faollik yozilmadi")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "raqamlarim",
		Method:      http.MethodGet,
		Path:        "/raqamlar",
		Summary:     "Hisobingizdagi raqamlar",
		Tags:        []string{"raqamlar"},
	}, func(ctx context.Context, _ *struct{}) (*handleListOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		list, err := s.handles.ForUser(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "raqamlar o'qilmadi")
		}

		out := &handleListOutput{}
		out.Body.Handles = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "raqam",
		Method:      http.MethodGet,
		Path:        "/raqamlar/{raqam}",
		Summary:     "Bitta raqam",
		Tags:        []string{"raqamlar"},
	}, func(ctx context.Context, in *handlePathInput) (*handleOutput, error) {
		handle, err := s.owned(ctx, in.Raqam)
		if err != nil {
			return nil, err
		}

		out := &handleOutput{}
		out.Body.Handle = handle
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "profilni-saqlash",
		Method:      http.MethodPut,
		Path:        "/raqamlar/{raqam}/profil",
		Summary:     "Profilni tahrirlash",
		Description: "Tarif, holat va egalik bu yerdan o'zgarmaydi — ular profilning qismi emas.",
		Tags:        []string{"raqamlar"},
	}, func(ctx context.Context, in *saveProfileInput) (*handleOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		handle, problem, err := s.handles.SaveProfile(ctx, parsed.Normalized(), account.ID, in.Body)
		switch {
		case errors.Is(err, handles.ErrInvalid):
			// The sentence comes from the validator, which knows what was
			// wrong; the status says it was the caller's to fix.
			return nil, huma.Error422UnprocessableEntity(problem)
		case errors.Is(err, handles.ErrNotFound):
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		case err != nil:
			return nil, internalError(err, "profil saqlanmadi")
		}

		out := &handleOutput{}
		out.Body.Handle = handle
		return out, nil
	})
}

// ownedNumber is the door: signed in, the number is a real one, and it is
// theirs. It answers with the caller and the number's canonical form, which is
// all a route needs that is not about the profile itself.
//
// A number somebody else owns gets the same 404 an invented one gets, so a
// guesser cannot use the difference to find out which numbers are taken.
func (s *Server) ownedNumber(ctx context.Context, raw string) (auth.Account, string, error) {
	account, err := requireAccount(ctx)
	if err != nil {
		return auth.Account{}, "", err
	}

	parsed, ok := handles.Parse(raw)
	if !ok {
		return auth.Account{}, "", huma.Error404NotFound("Bunday raqam yo'q.")
	}

	if _, err := s.handles.Owned(ctx, parsed.Normalized(), account.ID); err != nil {
		if errors.Is(err, handles.ErrNotFound) {
			return auth.Account{}, "", huma.Error404NotFound("Bunday raqam yo'q.")
		}
		return auth.Account{}, "", internalError(err, "raqam o'qilmadi")
	}

	return account, parsed.Normalized(), nil
}

// owned is the same door, for the routes that go on to render the profile.
func (s *Server) owned(ctx context.Context, raw string) (handles.Handle, error) {
	account, err := requireAccount(ctx)
	if err != nil {
		return handles.Handle{}, err
	}

	parsed, ok := handles.Parse(raw)
	if !ok {
		return handles.Handle{}, huma.Error404NotFound("Bunday raqam yo'q.")
	}

	handle, err := s.handles.Owned(ctx, parsed.Normalized(), account.ID)
	if errors.Is(err, handles.ErrNotFound) {
		return handles.Handle{}, huma.Error404NotFound("Bunday raqam yo'q.")
	}
	if err != nil {
		return handles.Handle{}, internalError(err, "raqam o'qilmadi")
	}

	return handle, nil
}
