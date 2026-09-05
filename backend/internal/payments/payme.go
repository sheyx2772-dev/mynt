// Package payments speaks the two providers' protocols.
//
// Ported from `landing/src/lib/payments`, which is where this ran until now and
// which was tested against Payme's own sandbox certification. Two things about
// that port are worth stating, because getting either wrong costs money.
//
// **Only one implementation may be registered at a time.** Payme and Click each
// hold one callback URL per merchant account. Two live endpoints answering for
// one account is two places for a transaction state machine to disagree, and
// the disagreement is somebody charged twice or not at all. The website's
// endpoints stay live until the cabinet is pointed here, and then they stop —
// it is a switch, not a fan-out.
//
// **The certification cases came with it.** Payme's sandbox tests a strict
// state machine: repeated calls returning identical timestamps, the twelve-hour
// timeout, and cancel-before-perform against cancel-after-perform. Those are in
// the tests beside this file, and they are the reason this is a port rather
// than a rewrite.
package payments

import (
	"crypto/subtle"
	"encoding/base64"
	"math"
	"time"
)

// Payme Merchant API — https://developer.help.paycom.uz/metody-merchant-api/
//
// JSON-RPC over one endpoint, driving a transaction state machine. The merchant
// must persist each transaction: after CreateTransaction, Payme identifies it
// only by its own id, so CheckTransaction and CancelTransaction arrive with no
// account information at all. Without a stored id → order mapping those methods
// cannot be answered and certification fails.

const (
	// Transport and RPC level.
	ErrParse                 = -32700
	ErrInvalidRequest        = -32600
	ErrMethodNotFound        = -32601
	ErrInsufficientPrivilege = -32504

	// Merchant level.
	ErrInvalidAmount       = -31001
	ErrInvalidAccount      = -31050
	ErrCantPerform         = -31008
	ErrTransactionNotFound = -31003
	ErrCantCancel          = -31007
)

// The four states a Payme transaction can be in.
const (
	StateCreated               = 1
	StatePerformed             = 2
	StateCancelled             = -1
	StateCancelledAfterPerform = -2
)

// Payme abandons a transaction that stays created this long.
const PaymeTimeout = 12 * time.Hour

// Message is what Payme shows the payer, in the three languages it asks for.
//
// Payme renders these inside its own app, so the Russian field carrying Uzbek
// text is not a formatting detail — it is a Russian-speaking customer being
// told, in a language they may not read, why their payment failed.
type Message struct {
	RU string `json:"ru"`
	UZ string `json:"uz"`
	EN string `json:"en"`
}

// Messages a payer sees. Ones only an integrator will ever read stay in one
// language and are passed through `plain`.
var (
	MsgOrderNotFound = Message{
		RU: "Заказ не найден",
		UZ: "Buyurtma topilmadi",
		EN: "Order not found",
	}
	MsgWrongAmount = Message{
		RU: "Неверная сумма",
		UZ: "Noto'g'ri summa",
		EN: "Wrong amount",
	}
	MsgOrderClosed = Message{
		RU: "Заказ уже закрыт",
		UZ: "Buyurtma allaqachon yopilgan",
		EN: "This order is already closed",
	}
	MsgOtherTransactionOpen = Message{
		RU: "По этому заказу уже открыта другая транзакция",
		UZ: "Buyurtma uchun boshqa tranzaksiya ochiq",
		EN: "Another transaction is already open for this order",
	}
	MsgTransactionNotFound = Message{
		RU: "Транзакция не найдена",
		UZ: "Tranzaksiya topilmadi",
		EN: "Transaction not found",
	}
	MsgWrongState = Message{
		RU: "Неверное состояние транзакции",
		UZ: "Tranzaksiya holati mos emas",
		EN: "The transaction is in the wrong state",
	}
	MsgExpired = Message{
		RU: "Срок транзакции истёк",
		UZ: "Tranzaksiya muddati tugagan",
		EN: "The transaction has expired",
	}
	MsgCancelled = Message{
		RU: "Транзакция отменена",
		UZ: "Tranzaksiya bekor qilingan",
		EN: "The transaction was cancelled",
	}
)

// plain is the same text in all three languages, which is right for a message
// only an integrator reads and wrong for anything a payer does.
func plain(text string) Message {
	return Message{RU: text, UZ: text, EN: text}
}

// VerifyAuth checks Payme's HTTP Basic header, where the username is literally
// "Paycom" and the password is the merchant key.
//
// Compared in constant time. A byte-by-byte comparison that returns early tells
// somebody guessing how much of their guess was right, one request at a time.
func VerifyAuth(header, key string) bool {
	if key == "" || header == "" {
		return false
	}
	expected := "Basic " + base64.StdEncoding.EncodeToString([]byte("Paycom:"+key))
	return subtle.ConstantTimeCompare([]byte(expected), []byte(header)) == 1
}

// Amounts arrive in tiyin; orders are priced in so'm.
func SumToTiyin(sum int64) int64 { return sum * 100 }

// AmountMatches compares what Payme sent against what the order is worth.
func AmountMatches(receivedTiyin float64, expectedSum int64) bool {
	// Payme sends a JSON number, which decodes as a float. Anything with a
	// fractional part is not a count of tiyin and cannot match.
	if receivedTiyin != math.Trunc(receivedTiyin) {
		return false
	}
	return int64(receivedTiyin) == SumToTiyin(expectedSum)
}

func IsExpired(createTime, now int64) bool {
	return now-createTime > PaymeTimeout.Milliseconds()
}

// CancelledState distinguishes a cancellation from a refund. Payme gives the
// two different terminal states, and certification checks both.
func CancelledState(current int) int {
	if current == StatePerformed {
		return StateCancelledAfterPerform
	}
	return StateCancelled
}
