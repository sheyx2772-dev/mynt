package api

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"net/netip"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/auth"
)

// The cookie the website and the panel are signed in with.
//
// The phone does not use it — an app has no cookie jar shared with a browser —
// and sends the same token as a bearer instead. One session, two ways to carry
// it, so `sessions` is the only place that decides whether somebody is signed
// in.
const sessionCookie = "flex_session"

type contextKey struct{ name string }

var (
	accountKey = contextKey{"account"}
	requestKey = contextKey{"request"}
)

// What a handler needs to know about the request itself.
//
// Gathered in the middleware because that is the only place holding a
// `huma.Context`; a handler is given a plain `context.Context` and cannot
// reach back for a header. Passing it forward this way also means a handler
// cannot accidentally read an unvalidated header — the fields here are the
// ones that have been through `clientIP`.
type requestInfo struct {
	IP        *netip.Addr
	UserAgent string
	// The session token as presented, so `chiqish` can end this session
	// without parsing the header a second time. Request-scoped and never
	// logged.
	Token string
}

// authenticate reads whatever credential the request carries and, if it names a
// live session, attaches the account to the context.
//
// It never refuses a request. Deciding that an endpoint needs somebody signed
// in belongs to the endpoint, and a middleware that rejected here would have to
// know which paths are public — a list that goes stale the first time one is
// added.
func (s *Server) authenticate(ctx huma.Context, next func(huma.Context)) {
	token := bearerToken(ctx.Header("Authorization"))
	if token == "" {
		if cookie, err := huma.ReadCookie(ctx, sessionCookie); err == nil {
			token = cookie.Value
		}
	}

	ctx = huma.WithValue(ctx, requestKey, requestInfo{
		IP:        s.clientIP(ctx),
		UserAgent: ctx.Header("User-Agent"),
		Token:     token,
	})

	if token == "" {
		next(ctx)
		return
	}

	account, err := s.auth.Authenticate(ctx.Context(), token)
	if err != nil {
		// An expired or unknown session is an anonymous request, not an error.
		// Anything else is worth knowing about, but not worth failing on: the
		// endpoint will refuse for want of an account.
		if !errors.Is(err, auth.ErrNoSession) {
			slog.Error("sessiya o'qilmadi", "xato", err)
		}
		next(ctx)
		return
	}

	next(huma.WithValue(ctx, accountKey, account))
}

// requestFrom is how a handler asks about the request rather than the caller.
func requestFrom(ctx context.Context) requestInfo {
	info, _ := ctx.Value(requestKey).(requestInfo)
	return info
}

// accountFrom is how a handler asks who is calling.
func accountFrom(ctx context.Context) (auth.Account, bool) {
	account, ok := ctx.Value(accountKey).(auth.Account)
	return account, ok
}

// requireAccount is the same question, phrased so that the answer can be
// returned. Every endpoint that touches somebody's data starts with this line.
func requireAccount(ctx context.Context) (auth.Account, error) {
	account, ok := accountFrom(ctx)
	if !ok {
		return auth.Account{}, huma.Error401Unauthorized("Avval hisobingizga kiring.")
	}
	return account, nil
}

// bearerToken pulls the token out of an Authorization header.
//
// The scheme is compared without case because RFC 7235 says it is
// case-insensitive and clients differ.
func bearerToken(header string) string {
	space := strings.IndexByte(header, ' ')
	if space < 0 || !strings.EqualFold(header[:space], "bearer") {
		return ""
	}
	return strings.TrimSpace(header[space+1:])
}

// clientIP is the address the rate limits count against.
//
// X-Forwarded-For is believed only when the deployment says something trusted
// sets it. A client can put anything in that header, so believing it without a
// proxy in front turns every per-address limit in the system into no limit at
// all — a different number each request.
func (s *Server) clientIP(ctx huma.Context) *netip.Addr {
	if s.cfg.TrustProxy {
		// The left-most entry is the original client; everything after it was
		// added by the hops in between.
		if forwarded := ctx.Header("X-Forwarded-For"); forwarded != "" {
			first, _, _ := strings.Cut(forwarded, ",")
			if addr, err := netip.ParseAddr(strings.TrimSpace(first)); err == nil {
				return &addr
			}
		}
	}

	host, _, err := net.SplitHostPort(ctx.RemoteAddr())
	if err != nil {
		host = ctx.RemoteAddr()
	}
	addr, err := netip.ParseAddr(host)
	if err != nil {
		return nil
	}
	return &addr
}

// sessionCookieFor is the cookie a browser is signed in with.
//
// Returned from the handler rather than written from the middleware, because
// Huma renders an `http.Cookie` in an output struct — which means it also
// appears in the OpenAPI document, and the panel's generated types know about
// it.
func (s *Server) sessionCookieFor(token string) http.Cookie {
	return http.Cookie{
		Name:  sessionCookie,
		Value: token,
		Path:  "/",
		// Unreadable from JavaScript, so a cross-site scripting bug on any page
		// cannot walk off with the session.
		HttpOnly: true,
		// Not sent over plain HTTP. Development is the exception, where there
		// is no certificate and the cookie would otherwise never be stored.
		Secure: !s.cfg.IsDevelopment(),
		// Lax rather than Strict: the sign-in link arrives from a mail client,
		// which is a cross-site navigation, and Strict would drop the cookie on
		// exactly that hop. Lax still refuses to attach it to a cross-site POST,
		// which is what a forged request would be.
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(auth.SessionLifetime.Seconds()),
		Expires:  time.Now().Add(auth.SessionLifetime),
	}
}

// expiredSessionCookie is the same cookie, told to go away.
func (s *Server) expiredSessionCookie() http.Cookie {
	return http.Cookie{
		Name:     sessionCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   !s.cfg.IsDevelopment(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	}
}
