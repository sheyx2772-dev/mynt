// Package api wires the HTTP surface.
//
// Huma sits on top of the standard library's router rather than replacing it.
// What it adds is a single description of each operation — its inputs, its
// outputs, its errors — from which it serves an OpenAPI document. That document
// is the point: the phone's Dart client and the admin panel's TypeScript client
// are generated from it, so a field renamed here breaks their builds instead of
// their users.
//
// The router underneath is `net/http`. Nothing in this package depends on the
// process it runs in, so the same handlers serve from a container, a VPS or a
// serverless function without being rewritten.
package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/admin"
	"github.com/sheyx2772-dev/flex/backend/internal/auth"
	"github.com/sheyx2772-dev/flex/backend/internal/config"
	"github.com/sheyx2772-dev/flex/backend/internal/handles"
	"github.com/sheyx2772-dev/flex/backend/internal/leads"
	"github.com/sheyx2772-dev/flex/backend/internal/notify"
	"github.com/sheyx2772-dev/flex/backend/internal/orders"
	"github.com/sheyx2772-dev/flex/backend/internal/payments"
	"github.com/sheyx2772-dev/flex/backend/internal/social"
	"github.com/sheyx2772-dev/flex/backend/internal/stats"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
	"github.com/sheyx2772-dev/flex/backend/internal/tags"
	"github.com/sheyx2772-dev/flex/backend/internal/teams"
	"github.com/sheyx2772-dev/flex/backend/internal/venues"
)

// Server holds what the handlers need. Passed in rather than reached for:
// a package-level pool cannot be swapped for a test one.
type Server struct {
	cfg     config.Config
	pool    *pgxpool.Pool
	auth    *auth.Service
	handles *handles.Store
	leads   *leads.Store
	stats   *stats.Store
	orders  *orders.Store
	admin   *admin.Store
	social  *social.Store
	venues  *venues.Store
	teams   *teams.Store
	tags    *tags.Store
	notify  *notify.Service
	// nil unless this deployment holds the provider secret keys.
	payments payments.Store
}

func New(cfg config.Config, pool *pgxpool.Pool, authService *auth.Service) http.Handler {
	s := &Server{
		cfg:     cfg,
		pool:    pool,
		auth:    authService,
		handles: handles.NewStore(pool),
		leads:   leads.NewStore(pool),
		stats:   stats.NewStore(pool),
		orders: orders.NewStore(pool, orders.Providers{
			PaymeMerchantID: cfg.PaymeMerchantID,
			ClickServiceID:  cfg.ClickServiceID,
			ClickMerchantID: cfg.ClickMerchantID,
			SiteURL:         cfg.SiteURL,
		}, cfg.IsDevelopment()),
		admin:  admin.NewStore(pool),
		social: social.NewStore(pool),
		venues: venues.NewStore(pool),
		teams:  teams.NewStore(pool, auth.NewLocalDirectory(pool)),
		tags:   tags.NewStore(pool),
	}

	// A nil channel is dropped rather than registered, so the service does not
	// carry an interface value that is never usable.
	var channels []notify.Channel
	if telegram := notify.NewTelegram(cfg.TelegramBotToken); telegram != nil {
		channels = append(channels, telegram)
	}
	s.notify = notify.New(store.New(pool), channels...)

	if cfg.TakesCallbacks() {
		s.payments = payments.NewPostgres(pool)
	}

	mux := http.NewServeMux()
	s.registerPaymentCallbacks(mux)

	humaConfig := huma.DefaultConfig("Flex API", "0.1.0")
	humaConfig.Info.Description = "Flex — raqamli shaxs va NFC profillari."
	// Versioned from the first day. Three clients read this API and they are
	// updated on their own schedules — an app store review can take a week —
	// so there has to be somewhere for a second version to live that is not on
	// top of the first.
	humaConfig.Servers = []*huma.Server{{URL: "/v1"}}

	api := humago.NewWithPrefix(mux, "/v1", humaConfig)

	// Runs before every handler and attaches the account when the request
	// carries a live session. It refuses nothing — see `authenticate`.
	api.UseMiddleware(s.authenticate)

	s.registerHealth(api)
	s.registerAuth(api)
	s.registerPassword(api)
	s.registerPhone(api)
	s.registerHandles(api)
	s.registerPublic(api)
	s.registerDirectory(api)
	s.registerSocial(api)
	s.registerVenues(api)
	s.registerMenu(api)
	s.registerMenuReads(api)
	s.registerStaff(api)
	s.registerVenueTab(api)
	s.registerVenueInvoices(api)
	s.registerTeams(api)
	s.registerTags(api)
	s.registerContacts(api)
	s.registerDesignRequests(api)
	s.registerLeads(api)
	s.registerStats(api)
	s.registerOrders(api)
	s.registerDevices(api)
	s.registerNotify(api)
	s.registerAdmin(api)
	s.registerAdminDetail(api)
	s.registerPromo(api)

	return mux
}

type aliveOutput struct {
	Status int
	Header struct {
		CacheControl string `header:"Cache-Control"`
	}
}

type healthOutput struct {
	Body struct {
		OK       bool   `json:"ok" doc:"Baza javob berdimi"`
		Database string `json:"database" example:"ok" doc:"Bazaning holati"`
	}
}

func (s *Server) registerHealth(api huma.API) {
	// Liveness. Answers without touching anything, because its question is
	// "is this process running" — and a probe that fails when the database is
	// slow gets the process restarted for somebody else's outage.
	huma.Register(api, huma.Operation{
		OperationID: "tirik",
		Method:      http.MethodGet,
		Path:        "/tirik",
		Summary:     "Jarayon ishlayaptimi",
		Tags:        []string{"salomatlik"},
	}, func(_ context.Context, _ *struct{}) (*aliveOutput, error) {
		out := &aliveOutput{Status: http.StatusNoContent}
		// Any cache between the prober and here would answer for the server
		// after it stopped answering, which is the failure this route exists
		// to detect.
		out.Header.CacheControl = "no-store"
		return out, nil
	})

	// Readiness. This one does ask the database, because its question is
	// "can this process serve a request", and the answer is no without one.
	huma.Register(api, huma.Operation{
		OperationID: "sogliq",
		Method:      http.MethodGet,
		Path:        "/sogliq",
		Summary:     "Baza bilan birga tekshiruv",
		Tags:        []string{"salomatlik"},
	}, func(ctx context.Context, _ *struct{}) (*healthOutput, error) {
		if err := s.pool.Ping(ctx); err != nil {
			// The error itself is not returned: it can carry a host name and a
			// user name, and this route is reachable without a token.
			return nil, huma.Error503ServiceUnavailable("baza javob bermayapti")
		}

		out := &healthOutput{}
		out.Body.OK = true
		out.Body.Database = "ok"
		return out, nil
	})
}
