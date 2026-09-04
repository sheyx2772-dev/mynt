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

	"github.com/sheyx2772-dev/flex/backend/internal/auth"
	"github.com/sheyx2772-dev/flex/backend/internal/config"
)

// Server holds what the handlers need. Passed in rather than reached for:
// a package-level pool cannot be swapped for a test one.
type Server struct {
	cfg  config.Config
	pool *pgxpool.Pool
	auth *auth.Service
}

func New(cfg config.Config, pool *pgxpool.Pool, authService *auth.Service) http.Handler {
	s := &Server{cfg: cfg, pool: pool, auth: authService}

	mux := http.NewServeMux()

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
