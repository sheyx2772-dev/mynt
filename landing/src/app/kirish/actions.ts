"use server";

import { backend } from "@/lib/backend/client";
import { startSession } from "@/lib/backend/session";
import { safePath } from "@/lib/safe-path";

// The two doors, both answered by our own backend.
//
// This used to call Supabase, and there used to be a third door through
// Telegram. The phone replaces it: SMS is what the app signs in with, it is
// what every payment app here signs in with, and one person arriving twice
// through two doors is one person with two accounts.

export type SignInResult = { sent: false; error: string } | { sent: true; email: string };

/**
 * Sends a one-time sign-in link.
 *
 * The backend creates the account when the link is followed rather than when
 * the address is typed, so there is no separate registration step — and an
 * address nobody can read mail at never becomes an account.
 */
export async function sendSignInLink(
  _prevState: SignInResult,
  formData: FormData,
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { sent: false, error: "To'g'ri email manzil kiriting." };
  }

  const { error } = await backend.POST("/kirish", { body: { email } });
  if (error) {
    return { sent: false, error: "Xat yuborib bo'lmadi. Qaytadan urinib ko'ring." };
  }

  // Said the same way whether the address has an account or not: the backend
  // answers identically, and this must not claim more than it said.
  return { sent: true, email };
}

// --- Telefon -------------------------------------------------------------

export type CodeResult =
  | { sent: false; error: string }
  // Only a development backend with no SMS provider fills `kod`, so the page
  // can be used before an Eskiz account exists. Production never sets it.
  | { sent: true; phone: string; kod?: string };

export async function sendSignInCode(
  _prevState: CodeResult,
  formData: FormData,
): Promise<CodeResult> {
  const phone = String(formData.get("telefon") ?? "").replace(/[^0-9]/g, "");

  if (phone.length < 9) {
    return { sent: false, error: "Raqamni to'liq kiriting." };
  }

  const { data, error } = await backend.POST("/kirish/telefon", {
    body: { telefon: phone },
  });
  if (error) {
    return { sent: false, error: "Kod yuborilmadi. Qaytadan urinib ko'ring." };
  }

  return { sent: true, phone, kod: data?.kod || undefined };
}

export type ConfirmResult = { ok: false; error: string } | { ok: true; next: string };

export async function confirmSignInCode(
  _prevState: ConfirmResult,
  formData: FormData,
): Promise<ConfirmResult> {
  const phone = String(formData.get("telefon") ?? "").replace(/[^0-9]/g, "");
  const kod = String(formData.get("kod") ?? "").replace(/[^0-9]/g, "");
  const next = safePath(String(formData.get("keyin") ?? ""));

  if (kod.length !== 6) return { ok: false, error: "Kod 6 xonali bo'lishi kerak." };

  const { data, error } = await backend.POST("/kirish/telefon/tasdiq", {
    body: { telefon: phone, kod },
  });

  if (error || !data?.token) {
    return { ok: false, error: "Kod noto'g'ri yoki eskirgan." };
  }

  await startSession(data.token);
  return { ok: true, next };
}
