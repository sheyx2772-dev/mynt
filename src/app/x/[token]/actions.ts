"use server";

import { sendTagMessage } from "@/lib/object-tags";

export type TagFormState = { error?: string; sent?: true };

/**
 * A stranger leaving a message, with no account and no session.
 *
 * Everything is read off the form and nothing is trusted: the token identifies
 * the thing, the rest is treated as hostile input and capped in the library.
 * There is no rate limit here because there is one where it belongs — beside
 * the write, where a second server action cannot bypass it.
 */
export async function sendFromTag(
  _previous: TagFormState,
  form: FormData,
): Promise<TagFormState> {
  const token = String(form.get("token") ?? "");

  const result = await sendTagMessage(token, {
    kind: String(form.get("kind") ?? ""),
    body: String(form.get("body") ?? ""),
    replyTo: String(form.get("replyTo") ?? ""),
    place: String(form.get("place") ?? ""),
  });

  if (result.ok) return { sent: true };

  switch (result.error) {
    case "gone":
      return { error: "Bu belgi endi ishlamaydi." };
    case "tooSoon":
      return { error: "Xabar allaqachon yuborilgan. Egasi xabardor." };
    case "needsReply":
      return { error: "Egasi siz bilan bog'lanishi uchun telefon yoki Telegram yozing." };
    default:
      return { error: "Yuborilmadi. Yana urinib ko'ring." };
  }
}
