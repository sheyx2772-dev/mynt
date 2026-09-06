"use server";

import { backend } from "@/lib/backend/client";
import { startSession } from "@/lib/backend/session";
import { safePath } from "@/lib/safe-path";

// The one door, answered by our own backend.
//
// There were three: a Telegram code, an email link, and this. Each extra door
// is another way for one person to end up with two accounts, and the number is
// the one everybody here already signs in with everywhere else. The email link
// still exists in the backend and `/kirish/tasdiq` still spends one, so an
// address that already has an account can still be let in — but nothing on the
// site asks for an address any more.

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
    return { sent: false, error: "SMS yuborilmadi. Raqamni tekshirib, qaytadan urinib ko'ring." };
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
    return { ok: false, error: "Kod noto'g'ri yoki muddati o'tgan. Yangi kod so'rang." };
  }

  await startSession(data.token);
  return { ok: true, next };
}
