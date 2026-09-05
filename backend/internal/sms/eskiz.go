package sms

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"sync"
	"time"
)

// Eskiz.uz, which is what most of this market sends through.
//
// Its API takes an email and a password, gives back a token that lasts about a
// month, and expects that token on every send. So the token is fetched on first
// use and again when the provider says it has expired — rather than on a timer,
// because a timer is a second thing that can be wrong about the same fact.
type Eskiz struct {
	email    string
	password string
	// The name a message appears from. It has to be approved by the operator
	// before anything but the test text will send.
	from   string
	client *http.Client

	mu    sync.Mutex
	token string
}

func NewEskiz(email, password, from string) *Eskiz {
	return &Eskiz{
		email:    email,
		password: password,
		from:     from,
		// Somebody is watching a form. Without a deadline the default is none,
		// and a slow provider becomes a hung request.
		client: &http.Client{Timeout: 15 * time.Second},
	}
}

func (e *Eskiz) Send(ctx context.Context, phone, text string) error {
	if err := e.send(ctx, phone, text); err == nil {
		return nil
	} else if !isUnauthorised(err) {
		return err
	}

	// The token expired. Fetched again once, and the message retried — a second
	// failure is a real one.
	if err := e.refresh(ctx); err != nil {
		return err
	}
	return e.send(ctx, phone, text)
}

func (e *Eskiz) send(ctx context.Context, phone, text string) error {
	e.mu.Lock()
	token := e.token
	e.mu.Unlock()

	if token == "" {
		if err := e.refresh(ctx); err != nil {
			return err
		}
		e.mu.Lock()
		token = e.token
		e.mu.Unlock()
	}

	body := &bytes.Buffer{}
	form := multipart.NewWriter(body)
	for field, value := range map[string]string{
		"mobile_phone": phone,
		"message":      text,
		"from":         e.from,
	} {
		if err := form.WriteField(field, value); err != nil {
			return err
		}
	}
	if err := form.Close(); err != nil {
		return err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://notify.eskiz.uz/api/message/sms/send", body)
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("Content-Type", form.FormDataContentType())

	return e.do(request)
}

func (e *Eskiz) refresh(ctx context.Context) error {
	body := &bytes.Buffer{}
	form := multipart.NewWriter(body)
	_ = form.WriteField("email", e.email)
	_ = form.WriteField("password", e.password)
	if err := form.Close(); err != nil {
		return err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://notify.eskiz.uz/api/auth/login", body)
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", form.FormDataContentType())

	response, err := e.client.Do(request)
	if err != nil {
		return fmt.Errorf("SMS xizmatiga ulanib bo'lmadi: %w", err)
	}
	defer drain(response)

	if response.StatusCode >= 300 {
		return fmt.Errorf("SMS xizmatiga kirib bo'lmadi (%d)", response.StatusCode)
	}

	var answer struct {
		Data struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 1<<16)).Decode(&answer); err != nil {
		return err
	}
	if answer.Data.Token == "" {
		return fmt.Errorf("SMS xizmati token bermadi")
	}

	e.mu.Lock()
	e.token = answer.Data.Token
	e.mu.Unlock()
	return nil
}

func (e *Eskiz) do(request *http.Request) error {
	response, err := e.client.Do(request)
	if err != nil {
		return fmt.Errorf("SMS yuborilmadi: %w", err)
	}
	defer drain(response)

	if response.StatusCode == http.StatusUnauthorized {
		return errUnauthorised
	}
	if response.StatusCode >= 300 {
		// A little of the body: the provider says why, and a status code alone
		// is not enough to act on. Capped, because an error page can be large.
		detail, _ := io.ReadAll(io.LimitReader(response.Body, 512))
		return fmt.Errorf("SMS yuborilmadi (%d): %s", response.StatusCode, detail)
	}
	return nil
}

func drain(response *http.Response) {
	// Read what is left so the connection is reused rather than closed and
	// reopened for the next message.
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 1<<16))
	_ = response.Body.Close()
}

type unauthorised struct{}

func (unauthorised) Error() string { return "SMS xizmati tokenni rad etdi" }

var errUnauthorised = unauthorised{}

func isUnauthorised(err error) bool {
	_, ok := err.(unauthorised)
	return ok
}
