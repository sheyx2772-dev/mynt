package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// Where accounts live.
//
// Not here. `auth.users` belongs to Supabase, and the website already
// authenticates against it — so an account created by this backend has to be
// the same account the website would have created, or a person who signed in
// on their phone would find their numbers missing on the site.
//
// The admin API is the supported way in, and `landing/src/lib/auth/telegram-login.ts`
// already uses it for the same reason. This is the Go side of the same door.
//
// An interface, so that this is the seam to cut when Supabase goes: an
// implementation that inserts into a table of our own satisfies it, and nothing
// above this file changes. It is also what lets the tests sign somebody in
// without an account anywhere.
type Directory interface {
	// FindOrCreate returns the account for an address, making one if there is
	// none.
	//
	// Following a link sent to an address is what proves the address, so the
	// account is made at that moment rather than when somebody typed it into a
	// form. Nothing exists for an address that was only ever entered.
	FindOrCreate(ctx context.Context, email string) (Account, error)
}

// SupabaseDirectory is the implementation the product runs on today.
type SupabaseDirectory struct {
	baseURL        string
	serviceRoleKey string
	client         *http.Client
}

func NewSupabaseDirectory(supabaseURL, serviceRoleKey string) *SupabaseDirectory {
	return &SupabaseDirectory{
		baseURL:        supabaseURL,
		serviceRoleKey: serviceRoleKey,
		// A person is waiting at a sign-in form. Without a timeout the default
		// is none at all, and a slow provider becomes a hung request.
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (d *SupabaseDirectory) FindOrCreate(ctx context.Context, email string) (Account, error) {
	if account, found, err := d.find(ctx, email); err != nil || found {
		return account, err
	}
	return d.create(ctx, email)
}

type supabaseUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func (d *SupabaseDirectory) find(ctx context.Context, email string) (Account, bool, error) {
	// The filter is a query parameter, so it is escaped rather than formatted
	// in. An address is user input and this is a URL.
	endpoint := fmt.Sprintf("%s/auth/v1/admin/users?filter=%s&per_page=1",
		d.baseURL, url.QueryEscape(email))

	var page struct {
		Users []supabaseUser `json:"users"`
	}
	if err := d.call(ctx, http.MethodGet, endpoint, nil, &page); err != nil {
		return Account{}, false, err
	}

	// `filter` is a substring search, so a result is only ours if the address
	// matches exactly. Without this check, "aziz@example.com" could return the
	// account for "aziz@example.com.evil.uz" and sign somebody into it.
	for _, user := range page.Users {
		if equalFold(user.Email, email) {
			return Account{ID: user.ID, Email: user.Email, Verified: true}, true, nil
		}
	}
	return Account{}, false, nil
}

func (d *SupabaseDirectory) create(ctx context.Context, email string) (Account, error) {
	body := map[string]any{
		"email": email,
		// The address is confirmed by the fact that a link sent to it was
		// followed. Leaving this false would have Supabase send a second
		// confirmation mail for something already proven.
		"email_confirm": true,
	}

	var user supabaseUser
	if err := d.call(ctx, http.MethodPost, d.baseURL+"/auth/v1/admin/users", body, &user); err != nil {
		return Account{}, err
	}
	if user.ID == "" {
		return Account{}, fmt.Errorf("hisob yaratilmadi: javobda id yo'q")
	}

	return Account{ID: user.ID, Email: user.Email, Verified: true}, nil
}

func (d *SupabaseDirectory) call(ctx context.Context, method, endpoint string, body any, into any) error {
	var payload io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return err
		}
		payload = bytes.NewReader(encoded)
	}

	request, err := http.NewRequestWithContext(ctx, method, endpoint, payload)
	if err != nil {
		return err
	}
	// The service role key, which bypasses row level security and can create
	// accounts. It never leaves this process and is never logged.
	request.Header.Set("apikey", d.serviceRoleKey)
	request.Header.Set("Authorization", "Bearer "+d.serviceRoleKey)
	request.Header.Set("Content-Type", "application/json")

	response, err := d.client.Do(request)
	if err != nil {
		return fmt.Errorf("hisoblar xizmatiga ulanib bo'lmadi: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode >= 300 {
		// A little of the body, because the provider says why and a status code
		// alone is not enough to act on. Capped: an error page can be large.
		detail, _ := io.ReadAll(io.LimitReader(response.Body, 512))
		return fmt.Errorf("hisoblar xizmati %d qaytardi: %s", response.StatusCode, detail)
	}

	return json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(into)
}

// equalFold compares two addresses. Both sides are already lowercased by the
// time they reach here; this is the belt to that pair of braces.
func equalFold(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range len(a) {
		x, y := a[i], b[i]
		if 'A' <= x && x <= 'Z' {
			x += 'a' - 'A'
		}
		if 'A' <= y && y <= 'Z' {
			y += 'a' - 'A'
		}
		if x != y {
			return false
		}
	}
	return true
}
