package payments

import (
	"crypto/md5"
	"crypto/subtle"
	"encoding/hex"
	"math"
	"strconv"
	"strings"
)

// Click Merchant (SHOP API) — https://docs.click.uz/en/merchant-api-request/
//
// Click calls two endpoints in order: Prepare, then Complete. Both carry an MD5
// signature over a fixed concatenation of fields, and the two concatenations
// differ — Complete inserts `merchant_prepare_id` after `merchant_trans_id`.
// Getting that wrong rejects every payment as an invalid signature, which is
// why the two formulas are written out rather than shared.
//
// MD5 is Click's choice, not ours. It is a signature over fields we already
// hold, checked in constant time, and the secret is what makes it work — but it
// is not a hash anybody should copy for a new purpose.

const (
	ClickSuccess              = 0
	ClickSignCheckFailed      = -1
	ClickIncorrectAmount      = -2
	ClickActionNotFound       = -3
	ClickAlreadyPaid          = -4
	ClickUserNotFound         = -5
	ClickTransactionNotFound  = -6
	ClickFailedToUpdateUser   = -7
	ClickErrorInRequest       = -8
	ClickTransactionCancelled = -9
)

// Click sends these as `action`, and the value is part of the signature.
const (
	ClickActionPrepare  = "0"
	ClickActionComplete = "1"
)

// ClickRequest is what arrives on both endpoints. Every field is a string
// because that is how Click sends them, including the amount.
type ClickRequest struct {
	ClickTransID      string `json:"click_trans_id"`
	ServiceID         string `json:"service_id"`
	MerchantTransID   string `json:"merchant_trans_id"`
	MerchantPrepareID string `json:"merchant_prepare_id"`
	Amount            string `json:"amount"`
	Action            string `json:"action"`
	SignTime          string `json:"sign_time"`
	SignString        string `json:"sign_string"`
	Error             string `json:"error"`
}

// ClickSignString builds the signature Click should have sent.
//
//	Prepare:  click_trans_id + service_id + SECRET + merchant_trans_id + amount + action + sign_time
//	Complete: click_trans_id + service_id + SECRET + merchant_trans_id + merchant_prepare_id + amount + action + sign_time
func ClickSignString(req ClickRequest, secret string) string {
	parts := []string{req.ClickTransID, req.ServiceID, secret, req.MerchantTransID}
	if req.Action == ClickActionComplete {
		parts = append(parts, req.MerchantPrepareID)
	}
	parts = append(parts, req.Amount, req.Action, req.SignTime)

	sum := md5.Sum([]byte(strings.Join(parts, "")))
	return hex.EncodeToString(sum[:])
}

// VerifyClickSignature compares in constant time, so a wrong signature cannot
// be narrowed down by measuring how long the rejection takes.
func VerifyClickSignature(req ClickRequest, secret string) bool {
	if secret == "" {
		return false
	}
	expected := ClickSignString(req, secret)
	return subtle.ConstantTimeCompare([]byte(expected), []byte(req.SignString)) == 1
}

// ClickAmountMatches compares what Click sent against what the order is worth.
//
// Click sends a decimal string of so'm — "99000" or "99000.00" — so it is
// compared in tiyin rather than as floats.
func ClickAmountMatches(received string, expectedSum int64) bool {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(received), 64)
	if err != nil || math.IsInf(parsed, 0) || math.IsNaN(parsed) {
		return false
	}
	return int64(math.Round(parsed*100)) == expectedSum*100
}
