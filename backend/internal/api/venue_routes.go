package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/venues"
)

// A venue and its menu.
//
// Reading a menu is public — it is what a guest opens after tapping the tag on
// their table. Everything that changes one needs the owner's session, and the
// counter link is its own door: a long random token, which is what a waiter's
// phone has instead of an account.

type venuePath struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
}

type menuInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Til   string `query:"til" enum:"uz,ru,en" default:"uz"`
}

type menuOutput struct {
	Body struct {
		Venue      venues.Venue      `json:"obyekt"`
		Categories []venues.Category `json:"bolimlar"`
	}
}

type venueOutput struct {
	Body struct {
		Venue venues.Venue `json:"obyekt"`
	}
}

type createVenueInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Nom  string `json:"nom" minLength:"1" maxLength:"80"`
		Turi string `json:"turi" enum:"cafe,hotel,shop,other"`
	}
}

type saveVenueInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  venues.VenueInput
}

type pointsInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Nuqtalar []string `json:"nuqtalar" maxItems:"200"`
	}
}

type staffTokenOutput struct {
	Body struct {
		Token string `json:"kalit"`
	}
}

type askInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  venues.RequestInput
}

type requestsInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Holat string `query:"holat" enum:"new,done" required:"false"`
	Limit int    `query:"soni" minimum:"1" maximum:"200" default:"50"`
}

type requestsOutput struct {
	Body struct {
		Requests []venues.Request `json:"sorovlar"`
		Waiting  int64            `json:"kutilmoqda"`
	}
}

type requestPath struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	ID    string `path:"id" format:"uuid"`
}

func (s *Server) registerVenues(api huma.API) {
	number := func(raw string) (string, bool) {
		parsed, ok := handles.Parse(raw)
		if !ok {
			return "", false
		}
		return parsed.Normalized(), true
	}

	huma.Register(api, huma.Operation{
		OperationID: "menyu",
		Method:      http.MethodGet,
		Path:        "/profil/{raqam}/menyu",
		Summary:     "Obyekt va uning menyusi",
		Description: "Sessiya kerak emas — stoldagi tegni tegizgan mehmon ochadi.",
		Tags:        []string{"obyekt"},
	}, func(ctx context.Context, in *menuInput) (*menuOutput, error) {
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}

		venue, err := s.venues.ByHandle(ctx, raqam)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "obyekt o'qilmadi")
		}

		id, _ := uuid.Parse(venue.ID)
		menu, err := s.venues.Menu(ctx, id, in.Til)
		if err != nil {
			return nil, internalError(err, "menyu o'qilmadi")
		}

		out := &menuOutput{}
		out.Body.Venue = venue
		out.Body.Categories = menu
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "obyektim",
		Method:      http.MethodGet,
		Path:        "/raqamlar/{raqam}/obyekt",
		Summary:     "Obyekt — egasi uchun",
		Description: "Wi-Fi paroli va xodim kaliti faqat shu javobda.",
		Tags:        []string{"obyekt"},
	}, func(ctx context.Context, in *venuePath) (*venueOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}

		venue, err := s.venues.Owned(ctx, raqam, account.ID)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "obyekt o'qilmadi")
		}

		out := &venueOutput{}
		out.Body.Venue = venue
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "obyekt-yaratish",
		Method:        http.MethodPost,
		Path:          "/raqamlar/{raqam}/obyekt",
		Summary:       "Obyekt ochish",
		Description:   "Yangi obyekt 30 kunlik muddat bilan ochiladi.",
		Tags:          []string{"obyekt"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *createVenueInput) (*venueOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		venue, err := s.venues.Create(ctx, raqam, account.ID, in.Body.Nom, in.Body.Turi)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "obyekt ochilmadi")
		}

		out := &venueOutput{}
		out.Body.Venue = venue
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "obyekt-saqlash",
		Method:      http.MethodPut,
		Path:        "/raqamlar/{raqam}/obyekt",
		Summary:     "Obyekt ma'lumotlarini saqlash",
		Tags:        []string{"obyekt"},
	}, func(ctx context.Context, in *saveVenueInput) (*venueOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}

		venue, err := s.venues.Save(ctx, raqam, account.ID, in.Body)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "obyekt saqlanmadi")
		}

		out := &venueOutput{}
		out.Body.Venue = venue
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "nuqtalar",
		Method:      http.MethodPut,
		Path:        "/raqamlar/{raqam}/obyekt/nuqtalar",
		Summary:     "Stollar yoki xonalar ro'yxati",
		Tags:        []string{"obyekt"},
	}, func(ctx context.Context, in *pointsInput) (*venueOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}

		venue, err := s.venues.SetPoints(ctx, raqam, account.ID, in.Body.Nuqtalar)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "nuqtalar saqlanmadi")
		}

		out := &venueOutput{}
		out.Body.Venue = venue
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "xodim-kaliti",
		Method:      http.MethodPost,
		Path:        "/raqamlar/{raqam}/obyekt/kalit",
		Summary:     "Xodim havolasini yangilash",
		Description: "Eski havola shu zahoti ishlamay qoladi.",
		Tags:        []string{"obyekt"},
	}, func(ctx context.Context, in *venuePath) (*staffTokenOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}

		token, err := s.venues.RotateStaffToken(ctx, raqam, account.ID)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}
		if err != nil {
			return nil, internalError(err, "kalit yangilanmadi")
		}

		out := &staffTokenOutput{}
		out.Body.Token = token
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "sorov-yuborish",
		Method:        http.MethodPost,
		Path:          "/profil/{raqam}/sorov",
		Summary:       "Stoldan so'rov yuborish",
		Description:   "Sessiya kerak emas: so'rayotgan odam — telefonli mehmon.",
		Tags:          []string{"obyekt"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *askInput) (*struct{}, error) {
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}

		_, err := s.venues.Ask(ctx, raqam, in.Body, requestFrom(ctx).IP)
		switch {
		case errors.Is(err, venues.ErrNotFound):
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		case errors.Is(err, venues.ErrExpired):
			return nil, huma.Error403Forbidden("Obyekt obunasi tugagan.")
		case errors.Is(err, venues.ErrTooSoon):
			return nil, huma.Error429TooManyRequests("So'rov allaqachon yuborilgan. Biroz kuting.")
		case err != nil:
			return nil, internalError(err, "so'rov yozilmadi")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "sorovlar",
		Method:      http.MethodGet,
		Path:        "/raqamlar/{raqam}/sorovlar",
		Summary:     "Stollardan kelgan so'rovlar",
		Tags:        []string{"obyekt"},
	}, func(ctx context.Context, in *requestsInput) (*requestsOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday obyekt yo'q.")
		}

		list, err := s.venues.Requests(ctx, raqam, account.ID, in.Holat, int32(in.Limit))
		if err != nil {
			return nil, internalError(err, "so'rovlar o'qilmadi")
		}

		out := &requestsOutput{}
		out.Body.Requests = list
		out.Body.Waiting = s.venues.Waiting(ctx, raqam)
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "sorov-yopish",
		Method:        http.MethodPost,
		Path:          "/raqamlar/{raqam}/sorovlar/{id}/bajarildi",
		Summary:       "So'rovni bajarilgan deb belgilash",
		Tags:          []string{"obyekt"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *requestPath) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("So'rov topilmadi.")
		}
		if err := s.venues.Close(ctx, id, account.ID); err != nil {
			if errors.Is(err, venues.ErrNotFound) {
				return nil, huma.Error404NotFound("So'rov topilmadi.")
			}
			return nil, internalError(err, "so'rov yopilmadi")
		}
		return nil, nil
	})
}

// The counter link, which is its own door: the token is the whole credential.
//
// A miss is a 404 — the same answer a made-up token gets, so whoever is
// guessing learns nothing about whether any venue exists. Nothing about the
// owner comes back: the counter screen shows a name and a list of requests,
// and that is all it is allowed to know.
type staffInput struct {
	Token string `path:"kalit" minLength:"20" maxLength:"64"`
}

type staffOutput struct {
	Body struct {
		Venue    venues.Venue     `json:"obyekt"`
		Requests []venues.Request `json:"sorovlar"`
	}
}

func (s *Server) registerStaff(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "xodim-ekrani",
		Method:      http.MethodGet,
		Path:        "/xodim/{kalit}",
		Summary:     "Kassa ekrani",
		Description: "Sessiya emas, kalit. Xodim telefonida hisob bo'lmaydi.",
		Tags:        []string{"obyekt"},
	}, func(ctx context.Context, in *staffInput) (*staffOutput, error) {
		venue, err := s.venues.ByStaffToken(ctx, in.Token)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Havola ishlamaydi.")
		}
		if err != nil {
			return nil, internalError(err, "obyekt o'qilmadi")
		}

		list, err := s.venues.RequestsByToken(ctx, in.Token, 50)
		if err != nil {
			return nil, internalError(err, "so'rovlar o'qilmadi")
		}

		// The owner's own secrets are not the counter's business either: the
		// staff token got them here, and it should not hand them on.
		venue.StaffToken = ""
		venue.PlanExpiry = nil

		out := &staffOutput{}
		out.Body.Venue = venue
		out.Body.Requests = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "xodim-bajardi",
		Method:        http.MethodPost,
		Path:          "/xodim/{kalit}/sorovlar/{id}/bajarildi",
		Summary:       "Xodim so'rovni yopadi",
		Tags:          []string{"obyekt"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *struct {
		Token string `path:"kalit" minLength:"20" maxLength:"64"`
		ID    string `path:"id" format:"uuid"`
	}) (*struct{}, error) {
		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("So'rov topilmadi.")
		}
		if err := s.venues.CloseByToken(ctx, in.Token, id); err != nil {
			if errors.Is(err, venues.ErrNotFound) {
				return nil, huma.Error404NotFound("So'rov topilmadi.")
			}
			return nil, internalError(err, "so'rov yopilmadi")
		}
		return nil, nil
	})
}

type tabOutput struct {
	Body struct {
		Tab *venues.Tab `json:"obyekt"`
	}
}

func (s *Server) registerVenueTab(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "obyekt-yorligi",
		Method:      http.MethodGet,
		Path:        "/men/obyekt",
		Summary:     "Kabinetdagi obyekt yorlig'i",
		Description: "Obyekti yo'q hisob uchun null — bu odatiy holat.",
		Tags:        []string{"obyekt"},
	}, func(ctx context.Context, _ *struct{}) (*tabOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		out := &tabOutput{}
		if tab, ok := s.venues.MyTab(ctx, account.ID); ok {
			out.Body.Tab = &tab
		}
		return out, nil
	})
}

type invoicesOutput struct {
	Body struct {
		Invoices []venues.Invoice `json:"hisoblar"`
	}
}

type invoiceOutput struct {
	Body struct {
		Invoice venues.Invoice `json:"hisob"`
	}
}

type issueInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Nuqtalar int32 `json:"nuqtalar" minimum:"1" maximum:"1000"`
		Oylar    int32 `json:"oylar" minimum:"1" maximum:"24"`
		Oylik    int64 `json:"oylik" minimum:"0"`
		QqsFoizi int32 `json:"qqs_foizi" minimum:"0" maximum:"30"`
		Jami     int64 `json:"jami" minimum:"0"`
	}
}

func (s *Server) registerVenueInvoices(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "obyekt-hisoblari", Method: http.MethodGet,
		Path: "/raqamlar/{raqam}/hisoblar", Summary: "Obyektning hisob-fakturalari",
		Tags: []string{"obyekt"},
	}, func(ctx context.Context, in *venuePath) (*invoicesOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		list, err := s.venues.Invoices(ctx, parsed.Normalized(), account.ID)
		if err != nil {
			return nil, internalError(err, "hisoblar o'qilmadi")
		}

		out := &invoicesOutput{}
		out.Body.Invoices = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "obyekt-hisobi", Method: http.MethodGet,
		Path: "/hisoblar/{id}", Summary: "Bitta hisob-faktura",
		Tags: []string{"obyekt"},
	}, func(ctx context.Context, in *idInput) (*invoiceOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		invoice, err := s.venues.Invoice(ctx, id, account.ID)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "hisob o'qilmadi")
		}

		out := &invoiceOutput{}
		out.Body.Invoice = invoice
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "hisob-berish", Method: http.MethodPost,
		Path: "/raqamlar/{raqam}/hisoblar", Summary: "Hisob-faktura chiqarish",
		Description: "Summalar chaqiruvchidan keladi va qatorga ko'chiriladi — narxlar ro'yxati o'zgaradi, hujjat esa aytganini aytib turishi kerak.",
		Tags:        []string{"obyekt"}, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *issueInput) (*invoiceOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		invoice, err := s.venues.Issue(ctx, parsed.Normalized(), account.ID,
			in.Body.Nuqtalar, in.Body.Oylar, in.Body.QqsFoizi, in.Body.Oylik, in.Body.Jami)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "hisob berilmadi")
		}

		out := &invoiceOutput{}
		out.Body.Invoice = invoice
		return out, nil
	})
}
