package api

import (
	"log/slog"

	"github.com/danielgtaylor/huma/v2"
)

// internalError is what a handler returns when something behind it broke.
//
// The error goes to the log and a sentence goes to the caller. A database
// error string can carry a host name, a user name and the query that failed;
// none of that is the caller's business, and all of it is a map for somebody
// probing. `what` is a short Uzbek phrase naming the operation, so the log line
// says which one without the handler having to repeat itself.
func internalError(err error, what string) error {
	slog.Error(what, "xato", err)
	return huma.Error500InternalServerError("Nimadir noto'g'ri ketdi. Keyinroq urinib ko'ring.")
}
