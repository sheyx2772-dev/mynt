package admin

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Lists that do not fit on one screen.
//
// Offset paging, with a total beside it. A cursor is right for a feed somebody
// scrolls forever; this is a table with filters that somebody jumps around in,
// and it needs a total to draw the pager at all.

// Page is one screen of anything, and how much there is.
type Page[T any] struct {
	Items []T   `json:"royxat"`
	Total int64 `json:"jami"`
	// Echoed back so the client does not have to remember what it asked for —
	// and so a screen rendered from a stale response can tell.
	Skip int32 `json:"otkazilgan"`
	Size int32 `json:"soni"`
}

func (s *Store) OrdersPage(ctx context.Context, status string, size, skip int32) (Page[AdminOrder], error) {
	total, err := s.queries.CountOrders(ctx, optional(status))
	if err != nil {
		return Page[AdminOrder]{}, err
	}

	items, err := s.Orders(ctx, status, size, skip)
	if err != nil {
		return Page[AdminOrder]{}, err
	}

	return Page[AdminOrder]{Items: items, Total: total, Skip: skip, Size: size}, nil
}

func (s *Store) HandlesPage(ctx context.Context, term string, size, skip int32) (Page[AdminHandle], error) {
	total, err := s.queries.CountHandles(ctx, optional(term))
	if err != nil {
		return Page[AdminHandle]{}, err
	}

	rows, err := s.queries.AdminHandlesPaged(ctx, store.AdminHandlesPagedParams{
		Term: optional(term), PageSize: size, Skip: skip,
	})
	if err != nil {
		return Page[AdminHandle]{}, err
	}

	items := make([]AdminHandle, 0, len(rows))
	for _, row := range rows {
		items = append(items, AdminHandle{
			Number: deref(row.Normalized), Status: row.Status, Owner: deref(row.Owner),
			Name: deref(row.OwnerName), Plan: row.Plan, PricePaid: row.PricePaid,
			GiftReason: deref(row.GiftReason), ClaimedAt: optionalTime(row.ClaimedAt),
			Views: row.ViewCount,
		})
	}

	return Page[AdminHandle]{Items: items, Total: total, Skip: skip, Size: size}, nil
}

// Account is a customer: who they are, what they hold, what they have paid.
type Account struct {
	ID      string `json:"id"`
	Email   string `json:"email,omitempty"`
	Phone   string `json:"telefon,omitempty"`
	Country string `json:"davlat,omitempty"`

	Handles int64 `json:"raqamlar"`
	// What has actually been received from them, which is not what they have
	// ordered. A gift has no order and is not counted.
	Paid int64 `json:"tolagan"`

	LastPaid *time.Time `json:"oxirgi_tolov,omitempty"`
	Joined   *time.Time `json:"qoshilgan,omitempty"`
}

func (s *Store) AccountsPage(ctx context.Context, term string, size, skip int32) (Page[Account], error) {
	total, err := s.queries.CountAccounts(ctx, optional(term))
	if err != nil {
		return Page[Account]{}, err
	}

	rows, err := s.queries.AdminAccounts(ctx, store.AdminAccountsParams{
		Term: optional(term), PageSize: size, Skip: skip,
	})
	if err != nil {
		return Page[Account]{}, err
	}

	items := make([]Account, 0, len(rows))
	for _, row := range rows {
		items = append(items, Account{
			ID:       row.ID.String(),
			Email:    deref(row.Email),
			Phone:    deref(row.Phone),
			Country:  deref(row.Country),
			Handles:  row.Handles,
			Paid:     row.Paid,
			LastPaid: optionalTime(row.LastPaid),
			Joined:   optionalTime(row.Joined),
		})
	}

	return Page[Account]{Items: items, Total: total, Skip: skip, Size: size}, nil
}

// AccountOrders is everything one customer has ever ordered — the answer to
// "who paid what, and when".
func (s *Store) AccountOrders(ctx context.Context, userID string) ([]AdminOrder, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrBadPromo
	}

	rows, err := s.queries.AdminAccountOrders(ctx, id)
	if err != nil {
		return nil, err
	}

	out := make([]AdminOrder, 0, len(rows))
	for _, row := range rows {
		out = append(out, AdminOrder{
			ID: row.ID.String(), Handle: row.Handle, Amount: row.Amount,
			Kind: row.Kind, Status: row.Status, Provider: deref(row.Provider),
			CreatedAt: optionalTime(row.CreatedAt), PaidAt: optionalTime(row.PaidAt),
		})
	}
	return out, nil
}

func (s *Store) PromoCodesPage(ctx context.Context, size, skip int32) (Page[PromoCode], error) {
	total, err := s.queries.CountPromoCodes(ctx)
	if err != nil {
		return Page[PromoCode]{}, err
	}

	items, err := s.PromoCodes(ctx, size, skip)
	if err != nil {
		return Page[PromoCode]{}, err
	}

	return Page[PromoCode]{Items: items, Total: total, Skip: skip, Size: size}, nil
}
