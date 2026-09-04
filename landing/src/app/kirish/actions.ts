"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site";
import { safePath } from "@/lib/safe-path";
import {
  startTelegramLogin,
  drainTelegramLogins,
  claimTelegramLogin,
  signInWithTelegram,
} from "@/lib/auth/telegram-login";

export type SignInResult = { sent: false; error: string } | { sent: true; email: string };

// Sends a one-time sign-in link. Supabase creates the user on first use, so
// there's no separate registration step — one form covers both.
export async function sendSignInLink(
  _prevState: SignInResult,
  formData: FormData
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("keyin") ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { sent: false, error: "To'g'ri email manzil kiriting." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return { sent: false, error: "Baza ulanmagan. Keyinroq urinib ko'ring." };
  }

  const origin = await getSiteOrigin();
  const safeNext = safePath(next);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?keyin=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error) {
    if (error.status === 429) {
      return { sent: false, error: "Juda ko'p urinish. Bir necha daqiqadan so'ng qayta urining." };
    }
    return { sent: false, error: "Xat yuborib bo'lmadi. Qaytadan urinib ko'ring." };
  }

  return { sent: true, email };
}

// --- Telegram ------------------------------------------------------------
//
// The second door, and for this market the main one. Click, Uzum and Payme all
// sign people in by phone; ordinary buyers here do not read email. SMS costs
// money per message and Telegram does not.

export type TelegramStart =
  | { ok: true; code: string; deepLink: string; expiresAt: string }
  | { ok: false; error: string };

export async function beginTelegramSignIn(): Promise<TelegramStart> {
  const result = await startTelegramLogin();
  if (result.ok) return result;

  return {
    ok: false,
    error:
      result.error === "rateLimited"
        ? "Juda ko'p urinish. Bir soatdan so'ng qayta urining."
        : "Telegram orqali kirish hozir ishlamayapti.",
  };
}

export type TelegramPoll =
  | { state: "waiting" }
  | { state: "expired" }
  | { state: "done"; next: string }
  | { state: "error"; error: string };

/**
 * Called every couple of seconds while the person is away in Telegram.
 *
 * Each call drains the bot's queue before looking, so the answer arrives on
 * the same trip that noticed it — the tab is the only thing polling Telegram,
 * and it is polling precisely while it matters.
 */
export async function pollTelegramSignIn(
  code: string,
  next: string,
): Promise<TelegramPoll> {
  await drainTelegramLogins();

  const claim = await claimTelegramLogin(code);
  if (claim.state === "waiting") return { state: "waiting" };
  if (claim.state === "expired") return { state: "expired" };

  const signedIn = await signInWithTelegram(claim.chatId, claim.name);
  if (!signedIn.ok) {
    return { state: "error", error: "Kirib bo'lmadi. Qaytadan urinib ko'ring." };
  }

  return { state: "done", next: safePath(next) };
}
