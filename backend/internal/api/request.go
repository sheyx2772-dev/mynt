package api

import (
	"net"
	"net/netip"
	"strings"

	"github.com/danielgtaylor/huma/v2"

	"github.com/sheyx2772-dev/flex/backend/internal/handles"
)

// Reading a request: the credential it presents, and where it came from.
// Everything here treats the request as untrusted, because it is.

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

// number turns whatever case a client sent into the one stored.
//
// Handles are written `AAA777` in the database and typed every other way by
// people: on a card, in a URL somebody retyped, in a form. Parsing rather than
// pattern-matching in the request struct is what makes `aaa777` and `AAA777`
// the same number instead of one of them being a 422 nobody can explain.
func number(raw string) (string, bool) {
	parsed, ok := handles.Parse(raw)
	if !ok {
		return "", false
	}
	return parsed.Normalized(), true
}
