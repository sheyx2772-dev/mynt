package payments

import "context"

// Click's SHOP API. Two calls in order — Prepare, then Complete — each carrying
// a signature over a different concatenation of the same fields.

// ClickResponse is what Click expects back. Every field is omitted when empty
// because Click's parser is unhappy about nulls it did not ask for.
type ClickResponse struct {
	ClickTransID      string `json:"click_trans_id,omitempty"`
	MerchantTransID   string `json:"merchant_trans_id,omitempty"`
	MerchantPrepareID string `json:"merchant_prepare_id,omitempty"`
	MerchantConfirmID string `json:"merchant_confirm_id,omitempty"`
	Error             int    `json:"error"`
	ErrorNote         string `json:"error_note"`
}

func clickError(code int, note string) ClickResponse {
	return ClickResponse{Error: code, ErrorNote: note}
}

// HandleClickPrepare answers the first call: is this order payable?
func HandleClickPrepare(ctx context.Context, store Store, body ClickRequest, secret string, now Clock) ClickResponse {
	// The action is forced rather than trusted: a request that reached the
	// prepare endpoint is a prepare, whatever it says about itself, and the
	// signature is over the action too.
	body.Action = ClickActionPrepare
	if !VerifyClickSignature(body, secret) {
		return clickError(ClickSignCheckFailed, "Invalid signature")
	}

	order, err := store.FindOrder(ctx, body.MerchantTransID)
	if err != nil || order == nil {
		return clickError(ClickUserNotFound, "Order not found")
	}

	if !ClickAmountMatches(body.Amount, order.Amount) {
		return clickError(ClickIncorrectAmount, "Incorrect amount")
	}

	if order.Status == "paid" {
		return clickError(ClickAlreadyPaid, "Already paid")
	}
	if order.Status != "pending" {
		return clickError(ClickTransactionCancelled, "Order is not payable")
	}

	existing, err := store.FindClickTransaction(ctx, body.ClickTransID)
	if err == nil && existing == nil {
		prepared := now()
		_ = store.CreateClickTransaction(ctx, ClickTransaction{
			ID:         body.ClickTransID,
			OrderID:    order.ID,
			Amount:     order.Amount,
			PreparedAt: &prepared,
		})
	}

	return ClickResponse{
		ClickTransID:    body.ClickTransID,
		MerchantTransID: order.ID,
		// Click echoes this back in Complete, and it is part of that signature.
		MerchantPrepareID: order.ID,
		Error:             ClickSuccess,
		ErrorNote:         "Success",
	}
}

// HandleClickComplete answers the second call: the money has moved, or has not.
func HandleClickComplete(ctx context.Context, store Store, body ClickRequest, secret string, now Clock) ClickResponse {
	body.Action = ClickActionComplete
	if !VerifyClickSignature(body, secret) {
		return clickError(ClickSignCheckFailed, "Invalid signature")
	}

	order, err := store.FindOrder(ctx, body.MerchantTransID)
	if err != nil || order == nil {
		return clickError(ClickUserNotFound, "Order not found")
	}

	// Click reports its own failure by sending a negative error code.
	if failedAtClick(body.Error) {
		if order.Status == "pending" {
			_ = store.MarkOrderCancelled(ctx, order.ID)
			cancelled := now()
			_ = store.UpdateClickTransaction(ctx, body.ClickTransID, nil, nil, &cancelled)
		}
		return ClickResponse{
			ClickTransID:    body.ClickTransID,
			MerchantTransID: order.ID,
			Error:           ClickTransactionCancelled,
			ErrorNote:       "Transaction cancelled",
		}
	}

	if !ClickAmountMatches(body.Amount, order.Amount) {
		return clickError(ClickIncorrectAmount, "Incorrect amount")
	}

	if order.Status == "cancelled" || order.Status == "failed" {
		return clickError(ClickTransactionCancelled, "Transaction cancelled")
	}

	// Payme may have settled this order while the buyer was in Click.
	// Answering success would have Click debit a card for a number that is
	// already paid for.
	if SettledByAnother(order, "click") {
		return clickError(ClickTransactionCancelled, "Already paid")
	}

	// Checked only while the order is still pending, so Click retrying its own
	// completed payment is not refused for a number that is by then correctly
	// claimed.
	if order.Status == "pending" {
		held, err := store.IsHandleStillHeld(ctx, order.ID)
		if err == nil && !held {
			_ = store.MarkOrderCancelled(ctx, order.ID)
			return clickError(ClickTransactionCancelled, "Reservation expired")
		}

		// Retries must not settle the order twice.
		if err := store.MarkOrderPaid(ctx, order.ID, "click", body.ClickTransID); err != nil {
			return clickError(ClickFailedToUpdateUser, "Could not settle")
		}
		completed := now()
		_ = store.UpdateClickTransaction(ctx, body.ClickTransID, nil, &completed, nil)
	}

	return ClickResponse{
		ClickTransID:      body.ClickTransID,
		MerchantTransID:   order.ID,
		MerchantConfirmID: order.ID,
		Error:             ClickSuccess,
		ErrorNote:         "Success",
	}
}

// failedAtClick reads the `error` field Click sends, which is a string holding
// a number. An unparseable one is not a failure report — it is noise, and
// treating noise as "cancel this order" would cancel orders for free.
func failedAtClick(raw string) bool {
	if raw == "" {
		return false
	}
	negative := raw[0] == '-'
	for _, c := range raw[1:] {
		if c < '0' || c > '9' {
			return false
		}
	}
	return negative && len(raw) > 1
}
