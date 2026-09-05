package payments

import "context"

// An in-memory Store. The Payme sandbox tests a strict state machine, and
// proving it here is both cheaper and more thorough than proving it against a
// live project — a test can move the clock twelve hours.
type fakeStore struct {
	orders     map[string]*Order
	paymeTxs   map[string]*PaymeTransaction
	clickTxs   map[string]*ClickTransaction
	paidCalls  []string
	handleLost bool
}

func newFakeStore(orders ...Order) *fakeStore {
	s := &fakeStore{
		orders:   map[string]*Order{},
		paymeTxs: map[string]*PaymeTransaction{},
		clickTxs: map[string]*ClickTransaction{},
	}
	if len(orders) == 0 {
		orders = []Order{{ID: "order-1", UserID: "u1", Handle: "MYN042", Amount: 99_000, Status: "pending"}}
	}
	for _, order := range orders {
		copied := order
		s.orders[order.ID] = &copied
	}
	return s
}

func (s *fakeStore) FindOrder(_ context.Context, id string) (*Order, error) {
	return s.orders[id], nil
}

func (s *fakeStore) MarkOrderPaid(_ context.Context, orderID, provider, _ string) error {
	s.paidCalls = append(s.paidCalls, orderID+":"+provider)
	if order := s.orders[orderID]; order != nil {
		order.Status = "paid"
		order.Provider = provider
	}
	return nil
}

func (s *fakeStore) MarkOrderCancelled(_ context.Context, orderID string) error {
	if order := s.orders[orderID]; order != nil && order.Status != "paid" {
		order.Status = "cancelled"
	}
	return nil
}

func (s *fakeStore) IsHandleStillHeld(_ context.Context, orderID string) (bool, error) {
	_, exists := s.orders[orderID]
	return exists && !s.handleLost, nil
}

func (s *fakeStore) FindPaymeTransaction(_ context.Context, id string) (*PaymeTransaction, error) {
	return s.paymeTxs[id], nil
}

func (s *fakeStore) FindPaymeTransactionByOrder(_ context.Context, orderID string) (*PaymeTransaction, error) {
	for _, tx := range s.paymeTxs {
		if tx.OrderID == orderID {
			return tx, nil
		}
	}
	return nil, nil
}

func (s *fakeStore) CreatePaymeTransaction(_ context.Context, tx PaymeTransaction) error {
	copied := tx
	s.paymeTxs[tx.ID] = &copied
	return nil
}

func (s *fakeStore) UpdatePaymeTransaction(_ context.Context, id string, state int, performTime, cancelTime int64, reason *int) error {
	tx := s.paymeTxs[id]
	if tx == nil {
		return nil
	}
	tx.State = state
	// Zero means "not set by this call", so a perform does not wipe a cancel
	// time and the other way round — the same shape the SQL update has.
	if performTime != 0 {
		tx.PerformTime = performTime
	}
	if cancelTime != 0 {
		tx.CancelTime = cancelTime
	}
	if reason != nil {
		tx.Reason = reason
	}
	return nil
}

func (s *fakeStore) FindClickTransaction(_ context.Context, id string) (*ClickTransaction, error) {
	return s.clickTxs[id], nil
}

func (s *fakeStore) CreateClickTransaction(_ context.Context, tx ClickTransaction) error {
	copied := tx
	s.clickTxs[tx.ID] = &copied
	return nil
}

func (s *fakeStore) UpdateClickTransaction(_ context.Context, id string, prepared, completed, cancelled *int64) error {
	tx := s.clickTxs[id]
	if tx == nil {
		return nil
	}
	if prepared != nil {
		tx.PreparedAt = prepared
	}
	if completed != nil {
		tx.CompletedAt = completed
	}
	if cancelled != nil {
		tx.CancelledAt = cancelled
	}
	return nil
}
