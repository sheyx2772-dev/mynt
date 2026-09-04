package api

import (
	"net/http"
	"time"

	"github.com/sheyx2772-dev/flex/backend/internal/auth"
)

// How a browser carries a session.

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
