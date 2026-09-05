package admin

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var ErrNotFound = errors.New("topilmadi")

// One order, with everything hanging off it.
//
// The question the panel is asked is "what happened to this order", and the
// answer is spread across three tables: what was bought, what the providers
// recorded, and whether a promo code was used. One shape rather than three
// screens.
type OrderDetail struct {
	AdminOrder

	BuyerID string `json:"xaridor_id,omitempty"`
	Months  *int32 `json:"oylar,omitempty"`

	ProviderTxID string     `json:"tolov_id,omitempty"`
	CancelledAt  *time.Time `json:"bekor_qilingan,omitempty"`

	// Empty and zero mean no code was used, which is what the tags say. sqlc
	// reads the subquery as non-null, and inventing a pointer here to carry a
	// distinction the caller does not make would be ceremony.
	PromoCode     string `json:"promokod,omitempty"`
	PromoDiscount int64  `json:"chegirma,omitempty"`

	Transactions []Transaction `json:"tranzaksiyalar"`
}

// Transaction is what a provider recorded, in one shape for both — because the
// question is what happened to the order, not what Payme did.
type Transaction struct {
	Provider  string     `json:"tolov"`
	ID        string     `json:"id"`
	State     string     `json:"holat"`
	StartedAt *time.Time `json:"boshlangan,omitempty"`
	SettledAt *time.Time `json:"tolangan,omitempty"`
	EndedAt   *time.Time `json:"bekor,omitempty"`
}

func (s *Store) Order(ctx context.Context, id string) (OrderDetail, error) {
	orderID, err := uuid.Parse(id)
	if err != nil {
		return OrderDetail{}, ErrNotFound
	}

	row, err := s.queries.AdminOrder(ctx, orderID)
	if errors.Is(err, pgx.ErrNoRows) {
		return OrderDetail{}, ErrNotFound
	}
	if err != nil {
		return OrderDetail{}, err
	}

	detail := OrderDetail{
		AdminOrder: AdminOrder{
			ID: row.ID.String(), Handle: row.Handle, Buyer: deref(row.Buyer),
			Amount: row.Amount, Kind: row.Kind, Status: row.Status,
			Provider: deref(row.Provider), CreatedAt: optionalTime(row.CreatedAt),
			PaidAt: optionalTime(row.PaidAt),
		},
		Months:        row.Months,
		ProviderTxID:  deref(row.ProviderTxID),
		CancelledAt:   optionalTime(row.CancelledAt),
		PromoCode:     row.PromoCode,
		PromoDiscount: row.PromoDiscount,
		Transactions:  []Transaction{},
	}
	if row.BuyerID != nil {
		detail.BuyerID = row.BuyerID.String()
	}

	rows, err := s.queries.AdminOrderTransactions(ctx, orderID)
	if err != nil {
		// The order is worth showing without them. A transaction table that
		// cannot be read is a smaller problem than a blank screen.
		return detail, nil
	}
	for _, tx := range rows {
		detail.Transactions = append(detail.Transactions, Transaction{
			Provider:  tx.Provider,
			ID:        tx.ID,
			State:     tx.State,
			StartedAt: optionalTime(tx.StartedAt),
			SettledAt: optionalTime(tx.SettledAt),
			EndedAt:   optionalTime(tx.EndedAt),
		})
	}

	return detail, nil
}
