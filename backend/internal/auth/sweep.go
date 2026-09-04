package auth

import (
	"context"
	"log/slog"
	"time"
)

// How often expired rows are cleared out. Hourly is far more often than the
// table needs and cheap enough not to matter: both deletes are an index scan
// over a range that is empty most of the time.
const sweepInterval = time.Hour

// Sweep deletes what has expired, until the context is cancelled.
//
// Nothing depends on this having run — every query already refuses an expired
// row, so a sweep that never happens is a larger table and not a security
// problem. What it does is stop `login_tokens` growing without limit, and that
// table is the one place an email address appears before there is an account
// to attach it to. Somebody who asked for a link and never followed it should
// not still be on file a year later.
//
// Run as a goroutine from main. Deliberately not a cron: it is one process and
// this costs nothing.
func (s *Service) Sweep(ctx context.Context) {
	ticker := time.NewTicker(sweepInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.sweepOnce(ctx)
		}
	}
}

func (s *Service) sweepOnce(ctx context.Context) {
	// Bounded, so a sweep cannot outlive its interval and have two overlap.
	ctx, cancel := context.WithTimeout(ctx, time.Minute)
	defer cancel()

	sessions, err := s.queries.DeleteExpiredSessions(ctx)
	if err != nil {
		// Logged and dropped. Housekeeping failing is not a reason to take a
		// server down, and the next tick tries again.
		slog.Error("eskirgan sessiyalar tozalanmadi", "xato", err)
		return
	}

	links, err := s.queries.DeleteExpiredLoginTokens(ctx)
	if err != nil {
		slog.Error("eskirgan havolalar tozalanmadi", "xato", err)
		return
	}

	if sessions > 0 || links > 0 {
		slog.Info("tozalandi", "sessiyalar", sessions, "havolalar", links)
	}
}
