// Sets an administrator's password.
//
// The panel has no self-service registration and no password reset that starts
// from an address — the sign-in link is that, and adding a second one would be
// a second thing to get wrong. So the first password has to be set from here,
// and this is also the way back when somebody is locked out entirely.
//
//	go run ./cmd/admin aziz@flex.uz
//
// The password is read from the terminal rather than taken as an argument: an
// argument is in the shell history, in `ps` output, and in whatever logs the
// machine keeps.
package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"golang.org/x/term"

	"github.com/sheyx2772-dev/flex/backend/internal/auth"
	"github.com/sheyx2772-dev/flex/backend/internal/config"
	"github.com/sheyx2772-dev/flex/backend/internal/database"
	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	if len(os.Args) != 2 {
		return errors.New("foydalanish: go run ./cmd/admin <email>")
	}
	email := strings.ToLower(strings.TrimSpace(os.Args[1]))

	_ = godotenv.Load()
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	// Said before anything else, because setting a password for an address that
	// is not on the list produces an account that can sign in and see nothing.
	if !cfg.IsAdmin(email) {
		fmt.Printf("Eslatma: %s ADMIN_EMAILS ro'yxatida yo'q — kira oladi, lekin panelni ko'rmaydi.\n", email)
	}

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	queries := store.New(pool)

	// The account must exist. Creating one here would mean this command could
	// mint administrators, and the only way in stays a link somebody followed.
	account, err := queries.AdminUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("%s uchun hisob yo'q — avval havola bilan bir marta kirsin", email)
	}
	if err != nil {
		return err
	}

	password, err := readPassword()
	if err != nil {
		return err
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}

	if err := queries.SetPassword(ctx, store.SetPasswordParams{UserID: account.ID, Hash: hash}); err != nil {
		return err
	}

	fmt.Printf("%s uchun parol o'rnatildi.\n", email)
	return nil
}

// readPassword takes it from the terminal without echoing, and asks twice —
// a mistyped password nobody can see is a lockout.
func readPassword() (string, error) {
	fd := int(os.Stdin.Fd())
	if !term.IsTerminal(fd) {
		// A pipe, which is how a script would call this. Read one line and
		// trust the caller to have kept it out of their history.
		//
		// EOF without a newline is a line: `printf 'x' | ...` sends no newline,
		// and refusing that would be refusing the obvious way to call this.
		line, err := bufio.NewReader(os.Stdin).ReadString('\n')
		if err != nil && !errors.Is(err, io.EOF) {
			return "", err
		}
		return strings.TrimSpace(line), nil
	}

	fmt.Print("Yangi parol: ")
	first, err := term.ReadPassword(fd)
	fmt.Println()
	if err != nil {
		return "", err
	}

	fmt.Print("Qaytaring: ")
	second, err := term.ReadPassword(fd)
	fmt.Println()
	if err != nil {
		return "", err
	}

	if string(first) != string(second) {
		return "", errors.New("parollar mos kelmadi")
	}
	return string(first), nil
}
