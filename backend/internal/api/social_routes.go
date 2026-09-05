package api

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/netip"
	"time"

	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/social"
)

// What happens around a profile.
//
// The reads are public because the page is; the writes all need a session,
// because every one of them attaches somebody's name to somebody else's
// profile.

type handleQuery struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
}

type viewInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Manba   string `json:"manba,omitempty" enum:"nfc,qr,share"`
		Havolal string `json:"havola,omitempty" maxLength:"80" doc:"Bosilgan havola nomi — bo'sh bo'lsa oddiy tashrif"`
	}
}

type followInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Obuna bool `json:"obuna"`
	}
}

type followOutput struct {
	Body struct {
		Obuna bool `json:"obuna"`
	}
}

type recommendInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Tavsiya bool `json:"tavsiya"`
	}
}

type recommendOutput struct {
	Body struct {
		Tavsiya bool  `json:"tavsiya"`
		Soni    int64 `json:"soni"`
	}
}

type recommendersOutput struct {
	Body struct {
		Recommenders []social.Recommender `json:"tavsiyachilar"`
	}
}

type commentsOutput struct {
	Body struct {
		Comments []social.Comment `json:"izohlar"`
	}
}

type addCommentInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	Body  struct {
		Matn string `json:"matn" minLength:"1" maxLength:"500"`
	}
}

type deleteCommentInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$"`
	ID    int64  `path:"id" minimum:"1"`
}

type postsOutput struct {
	Body struct {
		Posts []social.Post `json:"postlar"`
	}
}

type followCountOutput struct {
	Body struct {
		Soni int64 `json:"soni"`
	}
}

type feedInput struct {
	Limit int `query:"soni" minimum:"1" maximum:"100" default:"30"`
}

type postInput struct {
	Raqam string `path:"raqam" pattern:"^[A-Za-z]{3}[0-9]{3}$" example:"AAA777"`
	Body  struct {
		Text string `json:"matn" minLength:"1" maxLength:"1000"`
	}
}

type postIDInput struct {
	ID string `path:"id" format:"uuid"`
}

// The number the post was on, so the caller knows which pages to refresh.
type deletedPostOutput struct {
	Body struct {
		Handle string `json:"raqam"`
	}
}

func (s *Server) registerSocial(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID:   "tashrif",
		Method:        http.MethodPost,
		Path:          "/profil/{raqam}/tashrif",
		Summary:       "Tashrif yoki havola bosilishini yozish",
		Description:   "Sessiya kerak emas. Tashrifchi manzili emas, xeshi saqlanadi.",
		Tags:          []string{"profil"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *viewInput) (*struct{}, error) {
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		info := requestFrom(ctx)
		hash := visitorHash(info.IP, info.UserAgent)

		// A link click is a visit that went somewhere. Recorded as one thing
		// or the other, never both, or every tap counts twice.
		if in.Body.Havolal != "" {
			s.social.Click(ctx, raqam, in.Body.Havolal, hash)
		} else {
			s.social.View(ctx, social.Visit{
				Handle: raqam, VisitorHash: hash, Source: in.Body.Manba,
			})
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "obuna",
		Method:      http.MethodPut,
		Path:        "/profil/{raqam}/obuna",
		Summary:     "Obuna bo'lish yoki bekor qilish",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *followInput) (*followOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		on, err := s.social.SetFollowing(ctx, account.ID, raqam, in.Body.Obuna)
		if err != nil {
			return nil, internalError(err, "obuna o'zgarmadi")
		}

		out := &followOutput{}
		out.Body.Obuna = on
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "tavsiya",
		Method:      http.MethodPut,
		Path:        "/profil/{raqam}/tavsiya",
		Summary:     "Tavsiya qilish yoki qaytarib olish",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *recommendInput) (*recommendOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		on, count, err := s.social.SetRecommended(ctx, account.ID, raqam, in.Body.Tavsiya)
		if err != nil {
			return nil, internalError(err, "tavsiya o'zgarmadi")
		}

		out := &recommendOutput{}
		out.Body.Tavsiya = on
		out.Body.Soni = count
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "tavsiyachilar",
		Method:      http.MethodGet,
		Path:        "/profil/{raqam}/tavsiyachilar",
		Summary:     "Kim tavsiya qilgan",
		Description: "Faqat o'z raqami bor odamlar. Tekshirib bo'lmaydigan tavsiya — tavsiya emas.",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *handleQuery) (*recommendersOutput, error) {
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		list, err := s.social.Recommenders(ctx, raqam, 50)
		if err != nil {
			return nil, internalError(err, "tavsiyachilar o'qilmadi")
		}

		out := &recommendersOutput{}
		out.Body.Recommenders = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "izohlar",
		Method:      http.MethodGet,
		Path:        "/profil/{raqam}/izohlar",
		Summary:     "Profildagi izohlar",
		Description: "Izohlar yopiq bo'lsa bo'sh ro'yxat — sahifa yashiradigan qatorlar emas.",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *handleQuery) (*commentsOutput, error) {
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		viewer, _ := accountFrom(ctx)
		list, err := s.social.Comments(ctx, raqam, viewer.ID, 50)
		if err != nil {
			return nil, internalError(err, "izohlar o'qilmadi")
		}

		out := &commentsOutput{}
		out.Body.Comments = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "izoh-qoshish",
		Method:        http.MethodPost,
		Path:          "/profil/{raqam}/izohlar",
		Summary:       "Izoh qoldirish",
		Tags:          []string{"profil"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *addCommentInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		// The insert selects the profile by number and by comments being open,
		// so no rows means one or the other — and the same answer for both,
		// because a closed profile is not a thing to advertise.
		if err := s.social.AddComment(ctx, raqam, account.ID, in.Body.Matn); err != nil {
			return nil, huma.Error404NotFound("Bu profilga izoh qoldirib bo'lmaydi.")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "izoh-ochirish",
		Method:        http.MethodDelete,
		Path:          "/profil/{raqam}/izohlar/{id}",
		Summary:       "Izohni o'chirish",
		Description:   "Izoh muallifi yoki profil egasi o'chira oladi.",
		Tags:          []string{"profil"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *deleteCommentInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		gone, err := s.social.DeleteComment(ctx, in.ID, account.ID)
		if err != nil {
			return nil, internalError(err, "izoh o'chmadi")
		}
		if !gone {
			return nil, huma.Error404NotFound("Izoh topilmadi.")
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "postlar",
		Method:      http.MethodGet,
		Path:        "/profil/{raqam}/postlar",
		Summary:     "Profil postlari",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *handleQuery) (*postsOutput, error) {
		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		list, err := s.social.PostsFor(ctx, raqam, 50)
		if err != nil {
			return nil, internalError(err, "postlar o'qilmadi")
		}

		out := &postsOutput{}
		out.Body.Posts = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "post-yozish",
		Method:        http.MethodPost,
		Path:          "/profil/{raqam}/postlar",
		Summary:       "Post yozish",
		Description:   "Faqat o'z raqamingizga. Soatiga cheklov bor.",
		Tags:          []string{"profil"},
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *postInput) (*struct{}, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		raqam, ok := number(in.Raqam)
		if !ok {
			return nil, huma.Error404NotFound("Bunday raqam yo'q.")
		}

		_, err = s.social.AddPost(ctx, account.ID, raqam, in.Body.Text)
		switch {
		case errors.Is(err, social.ErrEmpty):
			return nil, huma.Error422UnprocessableEntity("Post bo'sh bo'lmasligi kerak.")
		case errors.Is(err, social.ErrTooMany):
			return nil, huma.Error429TooManyRequests("Bir soatda juda ko'p post. Birozdan so'ng urining.")
		case errors.Is(err, social.ErrNotOwned):
			return nil, huma.Error404NotFound("Bu raqam sizga tegishli emas.")
		case err != nil:
			return nil, internalError(err, "post saqlanmadi")
		}

		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "postni-ochirish",
		Method:        http.MethodDelete,
		Path:          "/postlar/{id}",
		Summary:       "Postni o'chirish",
		Tags:          []string{"profil"},
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *postIDInput) (*deletedPostOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		handle, err := s.social.DeletePost(ctx, account.ID, in.ID)
		if errors.Is(err, social.ErrNotOwned) {
			// Somebody else's post and an invented id get the same answer.
			return nil, huma.Error404NotFound("Post topilmadi.")
		}
		if err != nil {
			return nil, internalError(err, "post o'chirilmadi")
		}

		out := &deletedPostOutput{}
		out.Body.Handle = handle
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "obunalarim",
		Method:      http.MethodGet,
		Path:        "/men/obunalar",
		Summary:     "Nechta raqamga obunaman",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, _ *struct{}) (*followCountOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		out := &followCountOutput{}
		out.Body.Soni = s.social.CountFollowing(ctx, account.ID)
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "lenta",
		Method:      http.MethodGet,
		Path:        "/lenta",
		Summary:     "Obuna bo'lgan raqamlaringiz postlari",
		Tags:        []string{"profil"},
	}, func(ctx context.Context, in *feedInput) (*postsOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		list, err := s.social.Feed(ctx, account.ID, int32(in.Limit))
		if err != nil {
			return nil, internalError(err, "lenta o'qilmadi")
		}

		out := &postsOutput{}
		out.Body.Posts = list
		return out, nil
	})
}

// visitorHash is who looked, as far as anybody here needs to know.
//
// The owner's question is "how many people", not "which". An address in a table
// is a record of where somebody was, so it is salted with the day and hashed:
// two visits from one phone on one day are one visitor, and the same phone
// tomorrow is a new row nobody can join back to the first.
//
// The salt is the day rather than a secret, on purpose. A secret would let us
// re-identify somebody by rehashing their address, and not being able to is
// the property worth having.
func visitorHash(ip *netip.Addr, userAgent string) string {
	if ip == nil {
		return ""
	}
	day := time.Now().UTC().Format("2006-01-02")
	sum := sha256.Sum256([]byte(day + "|" + ip.String() + "|" + userAgent))
	return hex.EncodeToString(sum[:16])
}
