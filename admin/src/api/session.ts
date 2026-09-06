import { api } from "./client";

// Signing in to the panel.
//
// A username or an address, and a password. The panel could once mail
// itself a link; that door is gone, because a link is a door that opens for
// whoever reads the mailbox and this panel hands out numbers worth millions.
// A forgotten password is reset at the server with `cmd/admin`.
//
// None of this is what makes an administrator. The allow-list on the server
// decides that, and it lives where somebody holding this bundle cannot read
// it — so a stranger who signs in successfully still sees nothing.

export async function signInWithPassword(login: string, parol: string) {
	const { data, error } = await api.POST("/kirish/parol", {
		body: { login, parol },
	});
	if (error || !data) {
		// The server's own sentence, which is deliberately the same for a wrong
		// password and an address with no account.
		throw new Error(
			(error as { detail?: string })?.detail ?? "Kirib bo'lmadi.",
		);
	}
	return data.account;
}

export async function setPassword(parol: string) {
	const { error } = await api.PUT("/men/parol", { body: { parol } });
	if (error)
		throw new Error(
			(error as { detail?: string })?.detail ?? "Parol saqlanmadi.",
		);
}

/**
 * Who is signed in, or null.
 *
 * The cookie is set by the backend and sent by the browser; nothing in this
 * bundle can read it, which is the point of it being HttpOnly.
 */
export async function whoAmI() {
	const { data, error } = await api.GET("/men", {});
	if (error || !data) return null;
	return data.account;
}

export async function signOut() {
	await api.POST("/chiqish", {});
}
