package api

import (
	"context"
	"crypto/subtle"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/notify"
)

// What somebody finds in their cabinet, and where it is pushed.
//
// Every read here is scoped to the account on the session. There is no route
// that takes a user id, because a user id in a request is a claim the sender
// made about themselves.

type noticesOutput struct {
	Body struct {
		Notices []notify.Stored `json:"xabarlar"`
		Unread  int64           `json:"oqilmagan"`
	}
}

type linkOutput struct {
	Body struct {
		Link notify.TelegramLink `json:"ulanish"`
	}
}

type drainOutput struct {
	Body struct {
		Link notify.TelegramLink `json:"ulanish"`
		// How many accounts this pass linked. Not only this one: the poll is
		// shared, so somebody else's code may complete on our request.
		Linked int `json:"ulandi"`
	}
}

type remindInput struct {
	Authorization string `header:"Authorization" required:"true"`
}

type remindOutput struct {
	Body notify.Run
}

func (s *Server) registerNotify(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "xabarlar",
		Method:      http.MethodGet,
		Path:        "/xabarlar",
		Summary:     "Kelgan xabarlar",
		Tags:        []string{"xabarlar"},
	}, func(ctx context.Context, _ *struct{}) (*noticesOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		list, err := s.notify.List(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "xabarlar o'qilmadi")
		}
		unread, err := s.notify.Unread(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "xabarlar sanalmadi")
		}

		out := &noticesOutput{}
		out.Body.Notices = list
		out.Body.Unread = unread
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "xabarlarni-oqish",
		Method:      http.MethodPost,
		Path:        "/xabarlar/oqildi",
		Summary:     "Hammasini o'qilgan deb belgilash",
		Tags:        []string{"xabarlar"},
	}, func(ctx context.Context, _ *struct{}) (*noticesOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		if err := s.notify.MarkAllRead(ctx, account.ID); err != nil {
			return nil, internalError(err, "belgilanmadi")
		}

		list, err := s.notify.List(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "xabarlar o'qilmadi")
		}

		out := &noticesOutput{}
		out.Body.Notices = list
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "telegram-ulanish",
		Method:      http.MethodGet,
		Path:        "/xabarlar/telegram",
		Summary:     "Telegram ulanishi qay holatda",
		Tags:        []string{"xabarlar"},
	}, func(ctx context.Context, _ *struct{}) (*linkOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		link, err := s.notify.LinkState(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "ulanish o'qilmadi")
		}

		out := &linkOutput{}
		out.Body.Link = link
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "telegram-kod",
		Method:      http.MethodPost,
		Path:        "/xabarlar/telegram",
		Summary:     "Ulash uchun yangi kod olish",
		Description: "Kod 15 daqiqa yashaydi va bir marta ishlaydi.",
		Tags:        []string{"xabarlar"},
	}, func(ctx context.Context, _ *struct{}) (*linkOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		link, err := s.notify.StartLink(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "kod berilmadi")
		}

		out := &linkOutput{}
		out.Body.Link = link
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "telegram-tekshirish",
		Method:      http.MethodPost,
		Path:        "/xabarlar/telegram/tekshirish",
		Summary:     "Botga yuborilgan kodni tekshirish",
		Description: "Ulanish oynasi ochiq turganda chaqiriladi.",
		Tags:        []string{"xabarlar"},
	}, func(ctx context.Context, _ *struct{}) (*drainOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		linked, err := s.notify.Drain(ctx)
		if err != nil {
			// Telegram being unreachable is not this caller's problem: the
			// screen simply has nothing new to show yet.
			linked = 0
		}

		link, err := s.notify.LinkState(ctx, account.ID)
		if err != nil {
			return nil, internalError(err, "ulanish o'qilmadi")
		}

		out := &drainOutput{}
		out.Body.Link = link
		out.Body.Linked = linked
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "telegramni-uzish",
		Method:      http.MethodDelete,
		Path:        "/xabarlar/telegram",
		Summary:     "Telegramni uzish",
		Tags:        []string{"xabarlar"},
	}, func(ctx context.Context, _ *struct{}) (*linkOutput, error) {
		account, err := requireAccount(ctx)
		if err != nil {
			return nil, err
		}

		if err := s.notify.Unlink(ctx, account.ID); err != nil {
			return nil, internalError(err, "uzilmadi")
		}

		out := &linkOutput{}
		out.Body.Link = notify.TelegramLink{Available: s.notify.Linked(), State: "unavailable"}
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "eslatmalar",
		Method:      http.MethodPost,
		Path:        "/eslatmalar",
		Summary:     "Kunlik eslatma yugurishi",
		Description: "Rejalashtiruvchi uchun. CRON_SECRET talab qilinadi.",
		Tags:        []string{"xabarlar"},
	}, func(ctx context.Context, in *remindInput) (*remindOutput, error) {
		// No secret set means nobody may run it. Refusing is the safe
		// direction: the alternative is a public endpoint that spends
		// everybody's one reminder for the month.
		if s.cfg.CronSecret == "" {
			return nil, huma.Error503ServiceUnavailable("Sozlanmagan.")
		}

		// Constant time, because a byte-at-a-time comparison of a secret is a
		// secret that can be guessed one byte at a time.
		expected := "Bearer " + s.cfg.CronSecret
		if subtle.ConstantTimeCompare([]byte(in.Authorization), []byte(expected)) != 1 {
			return nil, huma.Error401Unauthorized("Ruxsat yo'q.")
		}

		return &remindOutput{Body: s.notify.Remind(ctx, time.Now())}, nil
	})
}
