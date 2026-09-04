package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/stats"
)

// What a number did.
//
// The ownership check is the whole security of this route. `stats.Store` does
// not check — it says so — because the check belongs where the caller is known,
// and doing it in both places means two answers to disagree about.
//
// The rows behind these numbers carry visitor hashes and referring hosts. None
// of that comes back here: only aggregates, and only for the person who owns
// the number they aggregate.

type statsInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$" example:"MYN042"`
	Days  int    `query:"kun" minimum:"1" maximum:"90" default:"30" doc:"Necha kunlik"`
}

type statsOutput struct {
	Body struct {
		Days   int          `json:"kun"`
		Report stats.Report `json:"hisobot"`
	}
}

func (s *Server) registerStats(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "statistika",
		Method:      http.MethodGet,
		Path:        "/raqamlar/{raqam}/statistika",
		Summary:     "Tashriflar, bosishlar va ular qayerdan kelgani",
		Description: "Tashrifchi haqidagi hech narsa saqlanmaydi va qaytarilmaydi — faqat yig'ma sonlar.",
		Tags:        []string{"statistika"},
	}, func(ctx context.Context, in *statsInput) (*statsOutput, error) {
		_, normalized, err := s.ownedNumber(ctx, in.Raqam)
		if err != nil {
			return nil, err
		}

		// Clamped again here rather than trusted to the schema. Huma enforces
		// the range on a value that is present; a caller that omits it gets
		// zero, and zero days of history is an empty chart nobody asked for.
		days := stats.Days(in.Days)

		report, err := s.stats.For(ctx, normalized, days)
		if err != nil {
			return nil, internalError(err, "statistika o'qilmadi")
		}

		out := &statsOutput{}
		out.Body.Days = days
		out.Body.Report = report
		return out, nil
	})
}
