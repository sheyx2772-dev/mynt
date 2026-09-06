package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/social"
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

type genesisInput struct {
	Seriya string `path:"seriya" pattern:"^[0-9]{6}$"`
}

type genesisOutput struct {
	Body struct {
		Card handles.GenesisCard `json:"karta"`
	}
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

		// Optional, not required: this is the page a stranger opens after
		// tapping a card, and most readers have no session at all. The only
		// thing a session changes here is whether the profile says it is
		// theirs.
		viewer, _ := accountFrom(ctx)

		profile, err := s.handles.Public(ctx, parsed.Normalized(), viewer.ID)
		if errors.Is(err, handles.ErrNotFound) {
			// The same answer for unclaimed, reserved and invented. Telling
			// them apart tells somebody working through the number space which
			// ones are worth a second look.
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "profil o'qilmadi")
		}

		// Only for a reader who has a session; a stranger has done neither and
		// asking would be two queries for two falses.
		if viewer.ID != "" {
			profile.Following = s.social.IsFollowing(ctx, viewer.ID, parsed.Normalized())
			profile.Recommended = s.social.IsRecommended(ctx, viewer.ID, parsed.Normalized())
			profile.Pending = s.social.State(ctx, viewer.ID, parsed.Normalized()) == social.FollowStatePending
		}

		// A closed profile is cut here, after the three facts that open it are
		// known. Cut on the server rather than hidden by the page: a hidden
		// field is still in the response, and a response is a file.
		profile = profile.ForReader(profile.Following).ForStranger(profile.Following)

		out := &publicProfileOutput{}
		out.Body.Profile = profile
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "genesis-karta",
		Method:      http.MethodGet,
		Path:        "/karta/{seriya}",
		Summary:     "Genesis karta",
		Description: "Birinchi partiyaning raqamlangan kartasi. Seriya — olti raqam, handle emas.",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *genesisInput) (*genesisOutput, error) {
		card, err := s.handles.Genesis(ctx, in.Seriya)
		if errors.Is(err, handles.ErrNotFound) {
			return nil, huma.Error404NotFound("Bunday karta yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "karta o'qilmadi")
		}

		out := &genesisOutput{}
		out.Body.Card = card
		return out, nil
	})
}
