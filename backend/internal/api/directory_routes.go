package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
)

// The directory, which is the one part of the product a search engine indexes
// and a stranger browses. No session anywhere: everything here is on a page
// anybody can open.

type residentsInput struct {
	Term  string `query:"qidiruv" maxLength:"40" required:"false" doc:"Raqam, ism yoki shahar"`
	Limit int    `query:"soni" minimum:"1" maximum:"200" default:"60"`
	// The directory has two orders and they answer different questions: what is
	// used, and who just arrived.
	Newest bool `query:"yangi" default:"false" doc:"Eng yangi qo'shilganlar"`
}

type residentsOutput struct {
	Body struct {
		Residents []handles.Resident `json:"rezidentlar"`
		// The whole AAA000 space beside the number taken, because "3 400 of
		// 17 576 000" says something that "3 400" does not.
		Claimed   int64 `json:"egallangan"`
		Namespace int   `json:"jami"`
	}
}

type topInput struct {
	Days  int `query:"kun" minimum:"1" maximum:"90" default:"3"`
	Limit int `query:"soni" minimum:"1" maximum:"50" default:"3"`
}

type topOutput struct {
	Body struct {
		Handles []handles.TopHandle `json:"raqamlar"`
	}
}

type listedOutput struct {
	Body struct {
		Handles []handles.Listed `json:"raqamlar"`
	}
}

func (s *Server) registerDirectory(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "rezidentlar",
		Method:      http.MethodGet,
		Path:        "/rezidentlar",
		Summary:     "Ochiq katalog",
		Description: "Egallangan raqamlar. Band qilinganlar bu yerda yo'q — band qilish tugallanmagan xarid.",
		Tags:        []string{"katalog"},
	}, func(ctx context.Context, in *residentsInput) (*residentsOutput, error) {
		var (
			list []handles.Resident
			err  error
		)
		if in.Newest {
			list, err = s.handles.Newest(ctx, int32(in.Limit))
		} else {
			list, err = s.handles.Residents(ctx, in.Term, int32(in.Limit))
		}
		if err != nil {
			return nil, internalError(err, "katalog o'qilmadi")
		}

		claimed, err := s.handles.CountClaimed(ctx)
		if err != nil {
			return nil, internalError(err, "katalog o'qilmadi")
		}

		out := &residentsOutput{}
		out.Body.Residents = list
		out.Body.Claimed = claimed
		out.Body.Namespace = handles.Namespace
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "eng-korilgan",
		Method:      http.MethodGet,
		Path:        "/rezidentlar/top",
		Summary:     "Oxirgi kunlarda eng ko'p ko'rilgan",
		Tags:        []string{"katalog"},
	}, func(ctx context.Context, in *topInput) (*topOutput, error) {
		list, err := s.handles.Top(ctx, int32(in.Days), int32(in.Limit))
		if err != nil {
			return nil, internalError(err, "top o'qilmadi")
		}

		out := &topOutput{}
		out.Body.Handles = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "raqamlar-royxati",
		Method:      http.MethodGet,
		Path:        "/rezidentlar/royxat",
		Summary:     "Sitemap uchun barcha egallangan raqamlar",
		Description: "Sahifalanmagan: bu bitta fayl, butunligicha yasaladi va kraulerlar kamdan-kam so'raydi.",
		Tags:        []string{"katalog"},
	}, func(ctx context.Context, _ *struct{}) (*listedOutput, error) {
		list, err := s.handles.Listed(ctx)
		if err != nil {
			return nil, internalError(err, "ro'yxat o'qilmadi")
		}

		out := &listedOutput{}
		out.Body.Handles = list
		return out, nil
	})
}
