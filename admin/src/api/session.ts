import { api } from "./client";

// Signing in to the panel.
//
// The same door as everywhere else: an address, a link, a session. The panel is
// not a second authentication system and has no password of its own — being on
// the allow-list is what makes an account an administrator, and that list lives
// on the server where somebody with this bundle cannot read it.

export async function signInWithPassword(email: string, parol: string) {
	const { data, error } = await api.POST("/kirish/parol", {
		body: { email, parol },
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

export async function requestLink(email: string) {
	const { error } = await api.POST("/kirish", { body: { email } });
	if (error) throw new Error("Havola yuborilmadi.");
}

export async function confirmLink(token: string) {
	const { data, error } = await api.POST("/kirish/tasdiq", { body: { token } });
	if (error || !data) throw new Error("Havola eskirgan yoki ishlatilgan.");
	return data.account;
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
