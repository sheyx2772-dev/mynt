package api

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/sheyx2772-dev/flex/backend/internal/payments"
)

// The provider callbacks.
//
// Registered on the mux directly rather than through Huma, because they speak
// somebody else's protocol: Payme wants JSON-RPC with its own error object and
// Click wants a flat body with a numeric `error` field. Neither wants
// problem+json, and describing them in our OpenAPI document would be describing
// them wrongly.
//
// Not under /v1 either. The version is a promise to our own clients about a
// shape we control; these shapes belong to Payme and Click, and change when
// they say so.
//
// **Only one deployment may be registered at a time.** Each provider holds one
// callback URL per merchant account. Until the cabinet is pointed here, the
// website's endpoints are the live ones and these answer nobody.

// A provider that sends nothing for this long has hung; the body is capped
// because it arrives from outside and nothing here needs a large one.
const (
	callbackTimeout  = 10 * time.Second
	maxCallbackBytes = 64 << 10
)

func (s *Server) registerPaymentCallbacks(mux *http.ServeMux) {
	if s.payments == nil {
		// No secret keys configured, so a callback could not be verified and
		// would have to be refused anyway. Not registering says that plainly:
		// the provider gets a 404 rather than a signature error it will retry.
		return
	}

	mux.HandleFunc("POST /payme", s.paymeCallback)
	mux.HandleFunc("POST /click/prepare", s.clickCallback(payments.HandleClickPrepare))
	mux.HandleFunc("POST /click/complete", s.clickCallback(payments.HandleClickComplete))
}

func (s *Server) paymeCallback(w http.ResponseWriter, r *http.Request) {
	// Payme authenticates with HTTP Basic, where the username is literally
	// "Paycom". Checked before the body is read: an unauthenticated caller
	// should not be able to make this server parse anything.
	if !payments.VerifyAuth(r.Header.Get("Authorization"), s.cfg.PaymeSecretKey) {
		writeJSON(w, http.StatusOK, map[string]any{
			"jsonrpc": "2.0",
			"id":      nil,
			"error": map[string]any{
				"code":    payments.ErrInsufficientPrivilege,
				"message": map[string]string{"ru": "Недостаточно прав", "uz": "Ruxsat yo'q", "en": "Insufficient privilege"},
			},
		})
		return
	}

	var req payments.RPCRequest
	if err := decode(r, &req); err != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"jsonrpc": "2.0",
			"id":      nil,
			"error": map[string]any{
				"code":    payments.ErrParse,
				"message": map[string]string{"ru": "Ошибка разбора", "uz": "O'qib bo'lmadi", "en": "Parse error"},
			},
		})
		return
	}

	ctx, cancel := contextFor(r)
	defer cancel()

	// Always 200. Payme reads the error out of the body, and an HTTP status it
	// did not expect is treated as our server being broken rather than as an
	// answer — which it then retries.
	writeJSON(w, http.StatusOK, payments.HandlePayme(ctx, s.payments, req, now))
}

type clickHandler func(ctx context.Context, store payments.Store, body payments.ClickRequest, secret string, now payments.Clock) payments.ClickResponse

func (s *Server) clickCallback(handle clickHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := readClickRequest(r)
		if err != nil {
			writeJSON(w, http.StatusOK, payments.ClickResponse{
				Error: payments.ClickErrorInRequest, ErrorNote: "Bad request",
			})
			return
		}

		ctx, cancel := contextFor(r)
		defer cancel()

		writeJSON(w, http.StatusOK, handle(ctx, s.payments, body, s.cfg.ClickSecretKey, now))
	}
}

func now() int64 { return time.Now().UnixMilli() }

// contextFor bounds a callback. A provider that opens a connection and then
// says nothing would otherwise hold a goroutine and a database connection for
// as long as it likes.
func contextFor(r *http.Request) (context.Context, context.CancelFunc) {
	return context.WithTimeout(r.Context(), callbackTimeout)
}

// Click sends form-encoded fields, and sometimes JSON. Both are accepted
// because which one arrives depends on how the cabinet was configured, and
// being wrong about it rejects every payment as a bad request.
func readClickRequest(r *http.Request) (payments.ClickRequest, error) {
	if ct := r.Header.Get("Content-Type"); len(ct) >= 16 && ct[:16] == "application/json" {
		var body payments.ClickRequest
		return body, decode(r, &body)
	}

	r.Body = http.MaxBytesReader(nil, r.Body, maxCallbackBytes)
	if err := r.ParseForm(); err != nil {
		return payments.ClickRequest{}, err
	}

	return payments.ClickRequest{
		ClickTransID:      r.PostForm.Get("click_trans_id"),
		ServiceID:         r.PostForm.Get("service_id"),
		MerchantTransID:   r.PostForm.Get("merchant_trans_id"),
		MerchantPrepareID: r.PostForm.Get("merchant_prepare_id"),
		Amount:            r.PostForm.Get("amount"),
		Action:            r.PostForm.Get("action"),
		SignTime:          r.PostForm.Get("sign_time"),
		SignString:        r.PostForm.Get("sign_string"),
		Error:             r.PostForm.Get("error"),
	}, nil
}

func decode(r *http.Request, into any) error {
	return json.NewDecoder(io.LimitReader(r.Body, maxCallbackBytes)).Decode(into)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		slog.Error("javob yozilmadi", "xato", err)
	}
}
