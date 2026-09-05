package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
)

// What anybody can read without signing in.
//
// The website's profile page is the product: somebody taps a card and a
// stranger's phone opens it. It cannot require a session, and it must not be
// able to ask for anything an owner would mind a stranger seeing — which is
// why it has its own store method and its own type rather than filtering an
// owner's row on the way out.

type publicProfileInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
}

type publicProfileOutput struct {
	Body struct {
		Profile handles.PublicProfile `json:"profil"`
	}
}

func (s *Server) registerPublic(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "profil",
		Method:      http.MethodGet,
		Path:        "/profil/{raqam}",
		Summary:     "Ochiq profil",
		Description: "Kartani tegizgan odam ko'radigan sahifa. Sessiya kerak emas.",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *publicProfileInput) (*publicProfileOutput, error) {
		// Parsed rather than uppercased: the pattern above already refuses the
		// wrong shape, and this is the one place that decides what "the same
		// number" means — qxd483 and QXD483 are one profile, not two.
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		profile, err := s.handles.Public(ctx, parsed.Normalized())
		if errors.Is(err, handles.ErrNotFound) {
			// The same answer for unclaimed, reserved and invented. Telling
			// them apart tells somebody working through the number space which
			// ones are worth a second look.
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "profil o'qilmadi")
		}

		out := &publicProfileOutput{}
		out.Body.Profile = profile
		return out, nil
	})
}
