package payments

import "context"

// The five methods, one per file section, in the order Payme calls them.

// CheckPerformTransaction — may this order be paid at all?
func checkPerform(ctx context.Context, store Store, req RPCRequest) map[string]any {
	orderID := orderIDOf(req.Params)
	if orderID == "" {
		return failure(req.ID, ErrInvalidAccount, MsgOrderNotFound, "")
	}

	order, err := store.FindOrder(ctx, orderID)
	if err != nil || order == nil {
		return failure(req.ID, ErrInvalidAccount, MsgOrderNotFound, "")
	}

	amount, ok := paramNumber(req.Params, "amount")
	if !ok || !AmountMatches(amount, order.Amount) {
		return failure(req.ID, ErrInvalidAmount, MsgWrongAmount, "")
	}

	if order.Status != "pending" {
		return failure(req.ID, ErrCantPerform, MsgOrderClosed, "")
	}

	return result(req.ID, map[string]any{"allow": true})
}

// CreateTransaction — Payme is about to ask the payer to confirm.
func createTransaction(ctx context.Context, store Store, req RPCRequest, now Clock) map[string]any {
	txID := paramString(req.Params, "id")
	if txID == "" {
		return failure(req.ID, ErrInvalidRequest, plain("Transaction id is required"), "")
	}

	// Payme retries CreateTransaction with the same id, and the answer must not
	// drift — the sandbox compares the timestamps between the two calls.
	existing, err := store.FindPaymeTransaction(ctx, txID)
	if err != nil {
		return failure(req.ID, ErrCantPerform, plain("Storage error"), "")
	}
	if existing != nil {
		if existing.State != StateCreated {
			return failure(req.ID, ErrCantPerform, MsgWrongState, "")
		}
		if IsExpired(existing.CreateTime, now()) {
			return expire(ctx, store, req, existing, now)
		}
		return txResult(req.ID, *existing)
	}

	orderID := orderIDOf(req.Params)
	if orderID == "" {
		return failure(req.ID, ErrInvalidAccount, MsgOrderNotFound, "")
	}

	order, err := store.FindOrder(ctx, orderID)
	if err != nil || order == nil {
		return failure(req.ID, ErrInvalidAccount, MsgOrderNotFound, "")
	}

	amount, ok := paramNumber(req.Params, "amount")
	if !ok || !AmountMatches(amount, order.Amount) {
		return failure(req.ID, ErrInvalidAmount, MsgWrongAmount, "")
	}

	if order.Status != "pending" {
		return failure(req.ID, ErrCantPerform, MsgOrderClosed, "")
	}

	// One live transaction per order, or two payers could both succeed.
	active, err := store.FindPaymeTransactionByOrder(ctx, orderID)
	if err == nil && active != nil &&
		(active.State == StateCreated || active.State == StatePerformed) {
		return failure(req.ID, ErrCantPerform, MsgOtherTransactionOpen, "")
	}

	// Payme's own clock, when it sent one. Using ours would make the timestamps
	// it compares across retries disagree with the ones it recorded.
	createTime := now()
	if sent, ok := paramNumber(req.Params, "time"); ok {
		createTime = int64(sent)
	}

	tx := PaymeTransaction{
		ID:         txID,
		OrderID:    orderID,
		Amount:     int64(amount),
		State:      StateCreated,
		CreateTime: createTime,
	}
	if err := store.CreatePaymeTransaction(ctx, tx); err != nil {
		return failure(req.ID, ErrCantPerform, plain("Storage error"), "")
	}

	return txResult(req.ID, tx)
}

// PerformTransaction — the payer confirmed and the money is moving.
func performTransaction(ctx context.Context, store Store, req RPCRequest, now Clock) map[string]any {
	txID := paramString(req.Params, "id")
	tx, err := store.FindPaymeTransaction(ctx, txID)
	if err != nil || tx == nil {
		return failure(req.ID, ErrTransactionNotFound, MsgTransactionNotFound, "")
	}

	// Already performed — repeat the original answer rather than paying twice.
	if tx.State == StatePerformed {
		return txResult(req.ID, *tx)
	}
	if tx.State != StateCreated {
		return failure(req.ID, ErrCantPerform, MsgCancelled, "")
	}
	if IsExpired(tx.CreateTime, now()) {
		return expire(ctx, store, req, tx, now)
	}

	// Click may have settled this order while Payme's transaction sat waiting.
	// Refusing here means Payme does not take the money at all, rather than
	// taking it and being refunded afterwards.
	order, err := store.FindOrder(ctx, tx.OrderID)
	if err == nil && order != nil && SettledByAnother(order, "payme") {
		_ = store.UpdatePaymeTransaction(ctx, txID, StateCancelled, 0, now(), reasonPtr(4))
		return failure(req.ID, ErrCantPerform, MsgCancelled, "")
	}

	// And the number may have lapsed while the transaction was held — thirty
	// minutes of reservation against twelve hours of Payme transaction. Taking
	// the money now would buy nothing.
	held, err := store.IsHandleStillHeld(ctx, tx.OrderID)
	if err == nil && !held {
		return expire(ctx, store, req, tx, now)
	}

	performTime := now()
	if err := store.UpdatePaymeTransaction(ctx, txID, StatePerformed, performTime, 0, nil); err != nil {
		return failure(req.ID, ErrCantPerform, plain("Storage error"), "")
	}
	if err := store.MarkOrderPaid(ctx, tx.OrderID, "payme", txID); err != nil {
		return failure(req.ID, ErrCantPerform, plain("Storage error"), "")
	}

	tx.State = StatePerformed
	tx.PerformTime = performTime
	return txResult(req.ID, *tx)
}
