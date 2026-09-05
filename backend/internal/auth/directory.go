package auth

import "context"

// Where accounts live.
//
// This used to be the seam to cut when Supabase went, with an implementation
// that called its admin API on one side and one that wrote to a table on the
// other. Supabase has gone, and the table is ours — so there is one
// implementation, in local_directory.go.
//
// The interface stays for the reason it was worth having before the cut, which
// is that a test can sign somebody in without an account existing anywhere.
type Directory interface {
	// FindOrCreate returns the account for an address, making one if there is
	// none.
	//
	// Following a link sent to an address is what proves the address, so the
	// account is made at that moment rather than when somebody typed it into a
	// form. Nothing exists for an address that was only ever entered.
	FindOrCreate(ctx context.Context, email string) (Account, error)
}
