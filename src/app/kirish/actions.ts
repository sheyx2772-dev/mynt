"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site";
import { safePath } from "@/lib/safe-path";

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
