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

// Changing a menu.
//
// Every one of these carries the owner's session and the number, and the
// statement behind it joins through `handles` — so a category id belonging to
// somebody else's cafe is a 404 rather than an edit. Nothing here checks
// ownership in Go, because there is nowhere it could be checked that the
// statement has not already decided.

type categoryBody struct {
	Nom venues.Text `json:"nom"`
}

type addCategoryInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  categoryBody
}

type categoryInput struct {
	ID   string `path:"id" format:"uuid"`
	Body categoryBody
}

type createdOutput struct {
	Status int
	Body   struct {
		ID string `json:"id"`
	}
}

type addItemInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  venues.ItemInput
}

type itemInput struct {
	ID   string `path:"id" format:"uuid"`
	Body venues.ItemInput
}

type itemFlagInput struct {
	ID   string `path:"id" format:"uuid"`
	Body struct {
		Bor bool `json:"bor"`
	}
}

type itemPhotoInput struct {
	ID   string `path:"id" format:"uuid"`
	Body struct {
		Rasm string `json:"rasm" maxLength:"500"`
	}
}

type moveInput struct {
	ID   string `path:"id" format:"uuid"`
	Body struct {
		Tartib int32 `json:"tartib" minimum:"0" maximum:"9999"`
	}
}

type idInput struct {
	ID string `path:"id" format:"uuid"`
}

func (s *Server) registerMenu(api huma.API) {
	// The three things every handler here starts with, so that none of them
	// forgets one.
	begin := func(ctx context.Context, raw string) (string, string, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return "", "", err
		}
		parsed, ok := handles.Parse(raw)
		if !ok {
			return "", "", huma.Error404NotFound("Bunday obyekt yo'q.")
		}
		return parsed.Normalized(), account.ID, nil
	}

	// A write that changed nothing is a write to something the caller does not
	// own, or to something that is gone. The same 404 for both.
	answer := func(err error, what string) error {
		switch {
		case errors.Is(err, venues.ErrNotFound):
			return huma.Error404NotFound("Topilmadi.")
		case err != nil:
			return internalError(err, what)
		}
		return nil
	}

	editing := func(ctx context.Context, raw string) (uuid.UUID, string, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return uuid.Nil, "", err
		}
		id, err := uuid.Parse(raw)
		if err != nil {
			return uuid.Nil, "", huma.Error404NotFound("Topilmadi.")
		}
		return id, account.ID, nil
	}

	huma.Register(api, huma.Operation{
		OperationID: "bolim-qoshish", Method: http.MethodPost,
		Path: "/raqamlar/{raqam}/menyu/bolimlar", Summary: "Menyuga bo'lim qo'shish",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *addCategoryInput) (*createdOutput, error) {
		raqam, owner, err := begin(ctx, in.Raqam)
		if err != nil {
			return nil, err
		}

		id, err := s.venues.AddCategory(ctx, raqam, owner, in.Body.Nom)
		if err != nil {
			return nil, answer(err, "bo'lim qo'shilmadi")
		}

		out := &createdOutput{Status: http.StatusCreated}
		out.Body.ID = id
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "bolim-tahrirlash", Method: http.MethodPut,
		Path: "/menyu/bolimlar/{id}", Summary: "Bo'lim nomini o'zgartirish",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *categoryInput) (*struct{}, error) {
		id, owner, err := editing(ctx, in.ID)
		if err != nil {
			return nil, err
		}
		return nil, answer(s.venues.EditCategory(ctx, id, owner, in.Body.Nom), "bo'lim saqlanmadi")
	})

	huma.Register(api, huma.Operation{
		OperationID: "bolim-ochirish", Method: http.MethodDelete,
		Path: "/menyu/bolimlar/{id}", Summary: "Bo'limni o'chirish",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *idInput) (*struct{}, error) {
		id, owner, err := editing(ctx, in.ID)
		if err != nil {
			return nil, err
		}
		return nil, answer(s.venues.RemoveCategory(ctx, id, owner), "bo'lim o'chmadi")
	})

	huma.Register(api, huma.Operation{
		OperationID: "bolim-kochirish", Method: http.MethodPut,
		Path: "/menyu/bolimlar/{id}/tartib", Summary: "Bo'lim tartibini o'zgartirish",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *moveInput) (*struct{}, error) {
		id, owner, err := editing(ctx, in.ID)
		if err != nil {
			return nil, err
		}
		return nil, answer(s.venues.MoveCategory(ctx, id, owner, in.Body.Tartib), "tartib saqlanmadi")
	})

	huma.Register(api, huma.Operation{
		OperationID: "taom-qoshish", Method: http.MethodPost,
		Path: "/raqamlar/{raqam}/menyu/taomlar", Summary: "Menyuga taom qo'shish",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *addItemInput) (*createdOutput, error) {
		raqam, owner, err := begin(ctx, in.Raqam)
		if err != nil {
			return nil, err
		}

		id, err := s.venues.AddItem(ctx, raqam, owner, in.Body)
		if err != nil {
			return nil, answer(err, "taom qo'shilmadi")
		}

		out := &createdOutput{Status: http.StatusCreated}
		out.Body.ID = id
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "taom-tahrirlash", Method: http.MethodPut,
		Path: "/menyu/taomlar/{id}", Summary: "Taomni tahrirlash",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *itemInput) (*struct{}, error) {
		id, owner, err := editing(ctx, in.ID)
		if err != nil {
			return nil, err
		}
		return nil, answer(s.venues.EditItem(ctx, id, owner, in.Body), "taom saqlanmadi")
	})

	huma.Register(api, huma.Operation{
		OperationID: "taom-bormi", Method: http.MethodPut,
		Path: "/menyu/taomlar/{id}/bor", Summary: "Taom bor yoki tugagan",
		Description: "Kunlik ish: oshxona tugagan taomni bir tegish bilan o'chiradi.",
		Tags:        []string{"menyu"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *itemFlagInput) (*struct{}, error) {
		id, owner, err := editing(ctx, in.ID)
		if err != nil {
			return nil, err
		}
		return nil, answer(s.venues.SetItemAvailable(ctx, id, owner, in.Body.Bor), "saqlanmadi")
	})

	huma.Register(api, huma.Operation{
		OperationID: "taom-rasmi", Method: http.MethodPut,
		Path: "/menyu/taomlar/{id}/rasm", Summary: "Taom rasmini belgilash",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *itemPhotoInput) (*struct{}, error) {
		id, owner, err := editing(ctx, in.ID)
		if err != nil {
			return nil, err
		}
		return nil, answer(s.venues.SetItemPhoto(ctx, id, owner, in.Body.Rasm), "rasm saqlanmadi")
	})

	huma.Register(api, huma.Operation{
		OperationID: "taom-kochirish", Method: http.MethodPut,
		Path: "/menyu/taomlar/{id}/tartib", Summary: "Taom tartibini o'zgartirish",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *moveInput) (*struct{}, error) {
		id, owner, err := editing(ctx, in.ID)
		if err != nil {
			return nil, err
		}
		return nil, answer(s.venues.MoveItem(ctx, id, owner, in.Body.Tartib), "tartib saqlanmadi")
	})

	huma.Register(api, huma.Operation{
		OperationID: "taom-ochirish", Method: http.MethodDelete,
		Path: "/menyu/taomlar/{id}", Summary: "Taomni o'chirish",
		Tags: []string{"menyu"}, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *idInput) (*struct{}, error) {
		id, owner, err := editing(ctx, in.ID)
		if err != nil {
			return nil, err
		}
		return nil, answer(s.venues.RemoveItem(ctx, id, owner), "taom o'chmadi")
	})
}

// One row, for the screen that edits it.
//
// Its own endpoint rather than filtering the whole menu on the client: the
// edit screen is reached by id from a link, and the ownership check has to
// happen where the id is looked up.
type oneItemOutput struct {
	Body struct {
		Item venues.Item `json:"taom"`
	}
}

type oneCategoryOutput struct {
	Body struct {
		Category venues.Category `json:"bolim"`
	}
}

func (s *Server) registerMenuReads(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "taom", Method: http.MethodGet,
		Path: "/menyu/taomlar/{id}", Summary: "Bitta taom — egasi uchun",
		Tags: []string{"menyu"},
	}, func(ctx context.Context, in *idInput) (*oneItemOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		item, err := s.venues.Item(ctx, id, account.ID)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "taom o'qilmadi")
		}

		out := &oneItemOutput{}
		out.Body.Item = item
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "bolim", Method: http.MethodGet,
		Path: "/menyu/bolimlar/{id}", Summary: "Bitta bo'lim — egasi uchun",
		Tags: []string{"menyu"},
	}, func(ctx context.Context, in *idInput) (*oneCategoryOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		id, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Topilmadi.")
		}

		category, err := s.venues.Category(ctx, id, account.ID)
		if errors.Is(err, venues.ErrNotFound) {
			return nil, huma.Error404NotFound("Topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "bo'lim o'qilmadi")
		}

		out := &oneCategoryOutput{}
		out.Body.Category = category
		return out, nil
	})
}
