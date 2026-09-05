package payments

import "context"

// What the protocol handlers need from the database, as an interface.
//
// The Payme sandbox tests a strict state machine, and proving it against an
// in-memory fake is far cheaper — and far more thorough — than proving it
// against a live project. Everything below this line is the protocol; the
// Postgres side is `postgres_store.go`.

type Order struct {
	ID     string
	UserID string
	Handle string
	// So'm. Providers send tiyin (Payme) or a decimal string (Click), and the
	// conversion happens at the edge so nothing inside works in two units.
	Amount int64
	Status string
	// Which provider settled it, once one has. Read before settling, because
	// one order is offered to both — see `SettledByAnother`.
	Provider string
}

type PaymeTransaction struct {
	// Payme's id, not ours.
	ID      string
	OrderID string
	// Tiyin, as Payme sends it.
	Amount int64
	State  int
	// Unix milliseconds, as Payme sends and expects them back.
	CreateTime  int64
	PerformTime int64
	CancelTime  int64
	Reason      *int
}

type ClickTransaction struct {
	// click_trans_id.
	ID      string
	OrderID string
	// So'm.
	Amount      int64
	PreparedAt  *int64
	CompletedAt *int64
	CancelledAt *int64
}

type Store interface {
	FindOrder(ctx context.Context, orderID string) (*Order, error)
	MarkOrderPaid(ctx context.Context, orderID, provider, providerTxID string) error
	MarkOrderCancelled(ctx context.Context, orderID string) error

	// Whether the number this order is for is still held by its buyer.
	//
	// Asked before a provider is allowed to take money. A reservation lasts
	// thirty minutes and a bank transfer does not always: the buyer opens the
	// payment page, the reservation lapses, somebody else buys the number, and
	// this payment then arrives for a number that is no longer theirs.
	// Refusing here means the card is not charged, rather than charged and
	// refunded afterwards by somebody who noticed.
	IsHandleStillHeld(ctx context.Context, orderID string) (bool, error)

	FindPaymeTransaction(ctx context.Context, id string) (*PaymeTransaction, error)
	FindPaymeTransactionByOrder(ctx context.Context, orderID string) (*PaymeTransaction, error)
	CreatePaymeTransaction(ctx context.Context, tx PaymeTransaction) error
	UpdatePaymeTransaction(ctx context.Context, id string, state int, performTime, cancelTime int64, reason *int) error

	FindClickTransaction(ctx context.Context, id string) (*ClickTransaction, error)
	CreateClickTransaction(ctx context.Context, tx ClickTransaction) error
	UpdateClickTransaction(ctx context.Context, id string, preparedAt, completedAt, cancelledAt *int64) error
}

// SettledByAnother reports that the other provider already took the money.
//
// One order is offered a Payme link and a Click link, because nobody knows
// which app the buyer has. Payme holds a transaction for up to twelve hours, so
// the buyer can open Payme, get bored, pay with Click, and then let Payme
// perform — and without this both providers debit a card for one number.
//
// Deliberately not "is the order paid": a provider retrying its own settlement
// must still get its own success back, or it retries forever and eventually
// raises a dispute.
func SettledByAnother(order *Order, provider string) bool {
	return order.Status == "paid" && order.Provider != "" && order.Provider != provider
}
