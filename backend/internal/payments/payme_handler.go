package payments

import (
	"context"
	"encoding/json"
)

// Payme's Merchant API as a function of (store, request, clock), so the whole
// state machine can be exercised without a database or a live account.
//
// The rules the sandbox actually checks, and which are easy to get wrong:
//   - repeated calls must be idempotent and return the *same* timestamps;
//   - a transaction created more than twelve hours ago can no longer be
//     performed;
//   - cancelling before payment is -1, cancelling after payment is -2;
//   - every method after CreateTransaction is addressed only by Payme's own
//     id, so the id → order mapping has to be stored.

// Clock is the current time in Unix milliseconds, which is what Payme sends
// and expects back. Injected so a test can move it twelve hours.
type Clock func() int64

// RPCRequest is one JSON-RPC call. `ID` is left as raw JSON because Payme sends
// a number here and expects the same value echoed back — decoding it as a
// number and re-encoding would turn 1 into 1.0 for some clients.
type RPCRequest struct {
	ID     json.RawMessage `json:"id"`
	Method string          `json:"method"`
	Params map[string]any  `json:"params"`
}

func result(id json.RawMessage, value any) map[string]any {
	return map[string]any{"jsonrpc": "2.0", "id": rawOrNull(id), "result": value}
}

func failure(id json.RawMessage, code int, message Message, data string) map[string]any {
	err := map[string]any{"code": code, "message": message}
	if data != "" {
		err["data"] = data
	}
	return map[string]any{"jsonrpc": "2.0", "id": rawOrNull(id), "error": err}
}

func rawOrNull(id json.RawMessage) any {
	if len(id) == 0 {
		return nil
	}
	return id
}

// The transaction as Payme wants it back. `transaction` is our own reference,
// which is the order — it is what we quoted the price for.
func txResult(id json.RawMessage, tx PaymeTransaction) map[string]any {
	return result(id, map[string]any{
		"transaction":  tx.OrderID,
		"state":        tx.State,
		"create_time":  tx.CreateTime,
		"perform_time": tx.PerformTime,
		"cancel_time":  tx.CancelTime,
	})
}

// HandlePayme answers one request. It never returns an error: every failure is
// a JSON-RPC error object, because that is the only thing Payme understands.
func HandlePayme(ctx context.Context, store Store, req RPCRequest, now Clock) map[string]any {
	switch req.Method {
	case "CheckPerformTransaction":
		return checkPerform(ctx, store, req)
	case "CreateTransaction":
		return createTransaction(ctx, store, req, now)
	case "PerformTransaction":
		return performTransaction(ctx, store, req, now)
	case "CancelTransaction":
		return cancelTransaction(ctx, store, req, now)
	case "CheckTransaction":
		return checkTransaction(ctx, store, req)
	default:
		return failure(req.ID, ErrMethodNotFound, plain("Method not found"), "")
	}
}

// The order id Payme was configured to send us, out of the account object.
func orderIDOf(params map[string]any) string {
	account, ok := params["account"].(map[string]any)
	if !ok {
		return ""
	}
	value, _ := account["order_id"].(string)
	return value
}

func paramString(params map[string]any, key string) string {
	value, _ := params[key].(string)
	return value
}

func paramNumber(params map[string]any, key string) (float64, bool) {
	value, ok := params[key].(float64)
	return value, ok
}
