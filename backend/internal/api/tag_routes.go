package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/tags"
)

// Tags on objects, and handing a number to somebody else.
//
// A tag's token is its own door, like the counter link: whoever taps the
// sticker has no account and never will, and asking them to sign in to say the
// wifi is down is asking them not to bother.

type tagTokenInput struct {
	Kalit string `path:"kalit" minLength:"16" maxLength:"48"`
}

type tagOutput struct {
	Body struct {
		Tag tags.Tag `json:"teg"`
	}
}

type tagsOutput struct {
	Body struct {
		Tags   []tags.Tag `json:"teglar"`
		Unread int64      `json:"oqilmagan"`
	}
}

type sayInput struct {
	Kalit string `path:"kalit" minLength:"16" maxLength:"48"`
	Body  struct {
		Turi       string `json:"turi" maxLength:"30"`
		Matn       string `json:"matn" minLength:"1" maxLength:"800"`
		JavobUchun string `json:"javob_uchun,omitempty" maxLength:"120"`
		Joy        string `json:"joy,omitempty" maxLength:"80"`
	}
}

type createTagInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Turi string `json:"turi" maxLength:"30"`
		Nom  string `json:"nom" minLength:"1" maxLength:"80"`
	}
}

type tagActiveInput struct {
	ID   string `path:"id" format:"uuid"`
	Body struct {
		Faol bool `json:"faol"`
	}
}

type messagesOutput struct {
	Body struct {
		Messages []tags.Message `json:"xabarlar"`
	}
}

type transfersOutput struct {
	Body struct {
		Transfers []tags.Transfer `json:"otkazishlar"`
	}
}

type offerInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Kimga string `json:"kimga" format:"email" maxLength:"120"`
	}
}

func (s *Server) registerTags(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "teg", Method: http.MethodGet, Path: "/teg/{kalit}",
		Summary: "Teg sahifasi", Description: "O'chirilgan teg topilmaydi — stikerni yechib olgan odam uni ishlamay qolishini kutadi.",
		Tags: []string{"teg"},
	}, func(ctx context.Context, in *tagTokenInput) (*tagOutput, error) {
		tag, err := s.tags.ByToken(ctx, in.Kalit)
		if errors.Is(err, tags.ErrNotFound) {
			return nil, huma.Error404NotFound("Teg topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "teg o'qilmadi")
		}

		out := &tagOutput{}
		out.Body.Tag = tag
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "teg-xabar", Method: http.MethodPost, Path: "/teg/{kalit}/xabar",
		Summary: "Tegdan xabar yuborish", Tags: []string{"teg"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *sayInput) (*struct{}, error) {
		_, err := s.tags.Say(ctx, in.Kalit, in.Body.Turi, in.Body.Matn,
			in.Body.JavobUchun, in.Body.Joy, requestFrom(ctx).IP)
		if errors.Is(err, tags.ErrNotFound) {
			return nil, huma.Error404NotFound("Teg topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "xabar yozilmadi")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "teglarim", Method: http.MethodGet,
		Path: "/raqamlar/{raqam}/teglar", Summary: "Raqamning teglari",
		Tags: []string{"teg"},
	}, func(ctx context.Context, in *venuePath) (*tagsOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		list, err := s.tags.ForHandle(ctx, parsed.Normalized(), account.ID)
		if err != nil {
			return nil, internalError(err, "teglar o'qilmadi")
		}

		out := &tagsOutput{}
		out.Body.Tags = list
		out.Body.Unread = s.tags.Unread(ctx, parsed.Normalized())
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "teg-yaratish", Method: http.MethodPost,
		Path: "/raqamlar/{raqam}/teglar", Summary: "Yangi teg",
		Tags: []string{"teg"}, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *createTagInput) (*tagOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		tag, err := s.tags.Create(ctx, parsed.Normalized(), account.ID, in.Body.Turi, in.Body.Nom)
		if errors.Is(err, tags.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "teg yaratilmadi")
		}

		out := &tagOutput{}
		out.Body.Tag = tag
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "teg-faol", Method: http.MethodPut, Path: "/teglar/{id}/faol",
		Summary: "Tegni yoqish yoki o'chirish", Tags: []string{"teg"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *tagActiveInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		err = s.tags.SetActive(ctx, id, account.ID, in.Body.Faol)
		if errors.Is(err, tags.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "saqlanmadi")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "teg-xabarlari", Method: http.MethodGet,
		Path: "/raqamlar/{raqam}/xabarlar", Summary: "Teglardan kelgan xabarlar",
		Tags: []string{"teg"},
	}, func(ctx context.Context, in *venuePath) (*messagesOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		list, err := s.tags.Messages(ctx, parsed.Normalized(), account.ID, 200)
		if err != nil {
			return nil, internalError(err, "xabarlar o'qilmadi")
		}

		out := &messagesOutput{}
		out.Body.Messages = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "xabarlar-oqildi", Method: http.MethodPost,
		Path: "/raqamlar/{raqam}/xabarlar/oqildi", Summary: "Barchasini o'qilgan deb belgilash",
		Tags: []string{"teg"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *venuePath) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		if err := s.tags.MarkRead(ctx, parsed.Normalized(), account.ID); err != nil {
			return nil, internalError(err, "belgilanmadi")
		}
		return nil, nil
	})

	// O'tkazish ---------------------------------------------------------------

	huma.Register(api, huma.Operation{
		OperationID: "otkazishlar", Method: http.MethodGet,
		Path: "/raqamlar/{raqam}/otkazishlar", Summary: "Shu raqam bo'yicha o'tkazishlar",
		Tags: []string{"otkazish"},
	}, func(ctx context.Context, in *venuePath) (*transfersOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		list, err := s.tags.TransfersFor(ctx, parsed.Normalized(), account.ID)
		if err != nil {
			return nil, internalError(err, "o'tkazishlar o'qilmadi")
		}

		out := &transfersOutput{}
		out.Body.Transfers = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "kelgan-otkazishlar", Method: http.MethodGet,
		Path: "/men/otkazishlar", Summary: "Menga taklif qilingan raqamlar",
		Tags: []string{"otkazish"},
	}, func(ctx context.Context, _ *struct{}) (*transfersOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		list, err := s.tags.Incoming(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "o'tkazishlar o'qilmadi")
		}

		out := &transfersOutput{}
		out.Body.Transfers = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "otkazish-taklif", Method: http.MethodPost,
		Path: "/raqamlar/{raqam}/otkazishlar", Summary: "Raqamni birovga taklif qilish",
		Description: "Manzilga taklif qilinadi — qabul qiluvchining hali hisobi bo'lmasligi mumkin. Taklif bir hafta amal qiladi.",
		Tags:        []string{"otkazish"}, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *offerInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		parsed, ok := handles.Parse(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		_, err = s.tags.Offer(ctx, parsed.Normalized(), account.ID, in.Body.Kimga)
		if errors.Is(err, tags.ErrTransferGone) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "taklif yozilmadi")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "otkazish-bekor", Method: http.MethodDelete,
		Path: "/otkazishlar/{id}", Summary: "Taklifni bekor qilish",
		Tags: []string{"otkazish"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *idInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		err = s.tags.Cancel(ctx, id, account.ID)
		if errors.Is(err, tags.ErrTransferGone) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "bekor qilinmadi")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "otkazish-qabul", Method: http.MethodPost,
		Path: "/otkazishlar/{id}/qabul", Summary: "Raqamni qabul qilish",
		Description: "Raqam ko'chishi va taklifning yopilishi bitta tranzaksiyada.",
		Tags:        []string{"otkazish"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *idInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		// Expired, already settled, or offered to somebody else — one answer,
		// because the difference is only useful to whoever is guessing ids.
		if _, err := s.tags.Accept(ctx, id, account.ID); err != nil {
			if errors.Is(err, tags.ErrTransferGone) {
				return nil, huma.Error404NotFound("Taklif topilmadi yoki muddati o'tgan.")
			}
			return nil, internalError(err, "qabul qilinmadi")
		}
		return nil, nil
	})
}
