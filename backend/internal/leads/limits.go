package leads

import (
	"context"
	"net/netip"
	"time"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Two windows, both an hour, and they stop different things.
//
// Per source, so a script cannot fill one profile with noise. Per profile, so
// it cannot be buried even from many sources — which is the attack that costs
// an owner something real: a hundred invented contacts hide the one meeting
// that was worth the price of the card.
const (
	perIPPerHour     = 10
	perHandlePerHour = 40
	window           = time.Hour
)

// allowed reports whether this submission may go through.
//
// A refused attempt is recorded by the caller as well as an accepted one, so
// hammering the limit does not reset it — otherwise the counter measures how
// often somebody stopped trying.
func (s *Store) allowed(ctx context.Context, normalized string, ip *netip.Addr) (bool, error) {
	seconds := int32(window.Seconds())

	// The per-profile window is checked first because it needs no address, and
	// a request with no address still has to be limited somehow.
	byHandle, err := s.queries.CountRecentLeadAttemptsByHandle(ctx, store.CountRecentLeadAttemptsByHandleParams{
		Handle:        &normalized,
		WindowSeconds: seconds,
	})
	if err != nil {
		return false, err
	}
	if byHandle >= perHandlePerHour {
		return false, nil
	}

	if ip == nil {
		return true, nil
	}

	bySource, err := s.queries.CountRecentLeadAttemptsByIP(ctx, store.CountRecentLeadAttemptsByIPParams{
		Ip:            ip,
		WindowSeconds: seconds,
	})
	if err != nil {
		return false, err
	}

	return bySource < perIPPerHour, nil
}

// record notes that an attempt happened, whatever came of it.
//
// Failing to write this must never fail the request: the visitor has done their
// part, and a lead lost because a counter could not be updated is the wrong
// trade in every direction.
func (s *Store) record(ctx context.Context, normalized string, ip *netip.Addr, succeeded bool) {
	_ = s.queries.RecordLeadAttempt(ctx, store.RecordLeadAttemptParams{
		Ip:        ip,
		Handle:    &normalized,
		Succeeded: succeeded,
	})
}
