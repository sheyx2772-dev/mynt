package handles

import (
	"context"
	"strings"
	"time"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// The public directory: who is here, and what is being looked at.
//
// Every read is of claimed numbers only. A reservation is an unfinished
// purchase and an unclaimed number is a price quote — there are 17.5M of the
// latter, and letting them into a list buries the people.

// Resident is one row of the directory. Deliberately less than a profile: a
// list of sixty people is not sixty profiles, and the fields not here are the
// ones that only matter once somebody has opened one.
type Resident struct {
	Handle   string     `json:"raqam"`
	Name     string     `json:"ism"`
	Bio      string     `json:"tavsif,omitempty"`
	Avatar   string     `json:"rasm,omitempty"`
	City     string     `json:"shahar,omitempty"`
	Tags     []string   `json:"teglar"`
	Views    int64      `json:"korishlar"`
	LastSeen *time.Time `json:"oxirgi_faollik,omitempty"`
}

// TopHandle is a number by how much it has been looked at lately.
type TopHandle struct {
	Handle string `json:"raqam"`
	Name   string `json:"ism"`
	Avatar string `json:"rasm,omitempty"`
	Views  int64  `json:"korishlar"`
}

// Listed is one line of the sitemap.
type Listed struct {
	Handle  string     `json:"raqam"`
	Updated *time.Time `json:"yangilangan,omitempty"`
}

// How many numbers there are: 26³ letters by 10³ digits, less the thousand
// behind every blocked combination.
//
// A constant rather than a count, because it is a property of the format and
// not of the data — but it is computed from the blocklist rather than written
// out, so the figure the site prints stays true when a word is added to it. A
// number nobody may buy is not a number we have.
var Namespace = 26*26*26*10*10*10 - len(blockedWords)*1000

// Residents lists the directory, filtered by a search term when there is one.
func (s *Store) Residents(ctx context.Context, term string, limit int32) ([]Resident, error) {
	rows, err := s.queries.Residents(ctx, store.ResidentsParams{
		Term: optional(strings.TrimSpace(term)), PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	out := make([]Resident, 0, len(rows))
	for _, row := range rows {
		out = append(out, Resident{
			Handle:   deref(row.Normalized),
			Name:     firstNonEmpty(deref(row.OwnerName), deref(row.Normalized)),
			Bio:      deref(row.Bio),
			Avatar:   deref(row.AvatarUrl),
			City:     deref(row.City),
			Tags:     row.Tags,
			Views:    row.ViewCount,
			LastSeen: optionalTime(row.LastSeenAt),
		})
	}
	return out, nil
}

// Newest lists the most recently claimed, skipping the ones nobody has filled
// in yet — a nameless profile is a resident, but not one to lead with.
func (s *Store) Newest(ctx context.Context, limit int32) ([]Resident, error) {
	rows, err := s.queries.NewestResidents(ctx, limit)
	if err != nil {
		return nil, err
	}

	out := make([]Resident, 0, len(rows))
	for _, row := range rows {
		out = append(out, Resident{
			Handle:   deref(row.Normalized),
			Name:     firstNonEmpty(deref(row.OwnerName), deref(row.Normalized)),
			Bio:      deref(row.Bio),
			Avatar:   deref(row.AvatarUrl),
			City:     deref(row.City),
			Tags:     row.Tags,
			Views:    row.ViewCount,
			LastSeen: optionalTime(row.LastSeenAt),
		})
	}
	return out, nil
}

// Top lists what has been looked at over the last few days.
func (s *Store) Top(ctx context.Context, days, limit int32) ([]TopHandle, error) {
	rows, err := s.queries.TopHandles(ctx, store.TopHandlesParams{Days: days, PageSize: limit})
	if err != nil {
		return nil, err
	}

	out := make([]TopHandle, 0, len(rows))
	for _, row := range rows {
		out = append(out, TopHandle{
			Handle: deref(row.Normalized),
			Name:   firstNonEmpty(deref(row.OwnerName), deref(row.Normalized)),
			Avatar: deref(row.AvatarUrl),
			Views:  row.Views,
		})
	}
	return out, nil
}

// CountClaimed is how many numbers are taken.
func (s *Store) CountClaimed(ctx context.Context) (int64, error) {
	return s.queries.CountResidents(ctx)
}

// Listed is every claimed number, for the sitemap.
func (s *Store) Listed(ctx context.Context) ([]Listed, error) {
	rows, err := s.queries.ClaimedHandles(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]Listed, 0, len(rows))
	for _, row := range rows {
		out = append(out, Listed{
			Handle:  deref(row.Normalized),
			Updated: optionalTime(row.UpdatedAt),
		})
	}
	return out, nil
}
