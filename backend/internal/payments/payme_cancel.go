package payments

import "context"

// Undoing and reporting. The other half of the state machine — create and
// perform take money, these two give it back and answer for it.

// CancelTransaction — before payment it is a cancellation, after it a refund,
// and Payme gives the two different terminal states.
func cancelTransaction(ctx context.Context, store Store, req RPCRequest, now Clock) map[string]any {
	txID := paramString(req.Params, "id")
	tx, err := store.FindPaymeTransaction(ctx, txID)
	if err != nil || tx == nil {
		return failure(req.ID, ErrTransactionNotFound, MsgTransactionNotFound, "")
	}

	// Already cancelled — return the recorded result unchanged, including its
	// original cancel_time. The sandbox compares them across retries.
	if tx.State == StateCancelled || tx.State == StateCancelledAfterPerform {
		return txResult(req.ID, *tx)
	}

	state := CancelledState(tx.State)
	cancelTime := now()

	var reason *int
	if sent, ok := paramNumber(req.Params, "reason"); ok {
		reason = reasonPtr(int(sent))
	}

	if err := store.UpdatePaymeTransaction(ctx, txID, state, 0, cancelTime, reason); err != nil {
		return failure(req.ID, ErrCantCancel, plain("Storage error"), "")
	}
	_ = store.MarkOrderCancelled(ctx, tx.OrderID)

	tx.State = state
	tx.CancelTime = cancelTime
	tx.Reason = reason
	return txResult(req.ID, *tx)
}

// CheckTransaction — Payme asking what we think the state is.
func checkTransaction(ctx context.Context, store Store, req RPCRequest) map[string]any {
	txID := paramString(req.Params, "id")
	tx, err := store.FindPaymeTransaction(ctx, txID)
	if err != nil || tx == nil {
		return failure(req.ID, ErrTransactionNotFound, MsgTransactionNotFound, "")
	}

	return result(req.ID, map[string]any{
		"transaction":  tx.OrderID,
		"state":        tx.State,
		"create_time":  tx.CreateTime,
		"perform_time": tx.PerformTime,
		"cancel_time":  tx.CancelTime,
		"reason":       tx.Reason,
	})
}

// expire closes a transaction that outlived its window and releases the order.
// Reason 4 is Payme's code for a timeout.
func expire(ctx context.Context, store Store, req RPCRequest, tx *PaymeTransaction, now Clock) map[string]any {
	_ = store.UpdatePaymeTransaction(ctx, tx.ID, StateCancelled, 0, now(), reasonPtr(4))
	_ = store.MarkOrderCancelled(ctx, tx.OrderID)
	return failure(req.ID, ErrCantPerform, MsgExpired, "")
}

func reasonPtr(value int) *int { return &value }
