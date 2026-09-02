import "server-only";

import { randomBytes } from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/rate-limit";
import { telegramUpdates, sendTelegramText, isTelegramConfigured } from "@/lib/notify/telegram";

// Signing in with Telegram.
//
// Three steps, and the middle one happens in an app we do not control:
//
//   1. We mint a code and show a link carrying it.
//   2. They tap it, Telegram sends the bot `/start <code>`, and we learn the
//      chat id of whoever answered.
//   3. They come back to the tab, which has been draining updates while they
//      were away, and the code is exchanged for a session.
//
// Polling rather than a webhook, because a webhook needs a public address and
// the domain is not pointed yet. It is cheap: Telegram only holds updates the
// bot has not acknowledged, and we only ask while somebody is waiting.

// Fifteen rather than five. Switching apps, signing into Telegram on a phone
// that had logged out, finding the Start button — five minutes ran out while
// somebody was still doing exactly what we asked.
const CODE_TTL_MS = 15 * 60 * 1000;
const PER_IP_PER_HOUR = 12;

/** The alphabet has no O/0 and no I/1: this is read on one screen, typed on another. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const isTelegramLoginConfigured =
  isTelegramConfigured && Boolean(process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME);

export type StartResult =
  | { ok: true; code: string; deepLink: string; expiresAt: string }
  | { ok: false; error: "unavailable" | "rateLimited" };

function newCode(): string {
  return Array.from(randomBytes(6))
    .map((byte) => ALPHABET[byte % ALPHABET.length])
    .join("");
}

export function botDeepLink(code: string): string {
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? "";
  return `https://t.me/${bot.replace(/^@/, "")}?start=${code}`;
}

export async function startTelegramLogin(): Promise<StartResult> {
  if (!isTelegramLoginConfigured || !supabaseAdmin) return { ok: false, error: "unavailable" };

  const ip = await getClientIp();
  const now = new Date();
  const since = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  // A code is minted when the page is rendered, so a reload must not mint
  // another: it would spend the rate limit on nothing and leave a trail of
  // codes nobody will ever answer. An outstanding one is still good.
  const { data: live } = await supabaseAdmin
    .from("telegram_logins")
    .select("code, expires_at")
    .eq("ip", ip ?? "")
    .is("chat_id", null)
    .is("consumed_at", null)
    .gt("expires_at", now.toISOString())
    // Oldest first, so two tabs that raced into existence converge on one
    // code instead of showing a different one each.
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (live) {
    return {
      ok: true,
      code: live.code as string,
      deepLink: botDeepLink(live.code as string),
      expiresAt: live.expires_at as string,
    };
  }

  // A code is a credential, and minting them is the cheap half of an attack:
  // without this, one address could fill the table and fish for collisions.
  const { count } = await supabaseAdmin
    .from("telegram_logins")
    .select("code", { count: "exact", head: true })
    .eq("ip", ip ?? "")
    .gte("created_at", since);

  if ((count ?? 0) >= PER_IP_PER_HOUR) return { ok: false, error: "rateLimited" };

  const code = newCode();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS).toISOString();

  const { error } = await supabaseAdmin
    .from("telegram_logins")
    .insert({ code, expires_at: expiresAt, ip });

  if (error) return { ok: false, error: "unavailable" };

  return { ok: true, code, deepLink: botDeepLink(code), expiresAt };
}

/**
 * Reads what the bot has been sent and answers any sign-in code it recognises.
 *
 * Shared with nothing: the notification linking flow drains the same queue, so
 * whichever of the two is watching acknowledges the updates for both. A message
 * that means nothing to one is left alone by it and picked up by the other —
 * neither deletes what it did not understand, because acknowledging is by
 * offset and always covers everything read.
 */
export async function drainTelegramLogins(): Promise<number> {
  if (!isTelegramLoginConfigured || !supabaseAdmin) return 0;

  const updates = await telegramUpdates();
  if (updates.length === 0) return 0;

  let answered = 0;

  for (const update of updates) {
    const code = update.text.trim().replace(/^\/start\s*/i, "").toUpperCase();

    // A bare /start. This is the common case and it used to be swallowed in
    // silence: somebody who already has the bot in their chat list opens it
    // there rather than through our link, so Telegram attaches no payload, and
    // the person is left looking at a bot that did not react.
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      await sendTelegramText(
        update.chatId,
        "Kirish uchun saytdagi <b>Telegram orqali kirish</b> tugmasini bosing — " +
          "yoki ekrandagi 6 xonali kodni shu yerga xabar qilib yuboring.",
      );
      continue;
    }

    const { data } = await supabaseAdmin
      .from("telegram_logins")
      .update({ chat_id: update.chatId, display_name: update.from.slice(0, 120) })
      .eq("code", code)
      .is("chat_id", null)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("code")
      .maybeSingle();

    if (data) {
      answered += 1;
      await sendTelegramText(update.chatId, "Tasdiqlandi. Saytga qayting — kirdingiz.");
    } else {
      // A code we have never issued, or one that has already been spent or has
      // run out. Saying so is better than saying nothing.
      await sendTelegramText(
        update.chatId,
        "Bu kod eskirgan yoki ishlatilgan. Saytda <b>Qaytadan urinish</b> tugmasini bosing.",
      );
    }
  }

  const highest = Math.max(...updates.map((u) => u.updateId));
  await telegramUpdates(highest + 1);

  return answered;
}

export type ClaimResult =
  | { state: "waiting" }
  | { state: "expired" }
  | { state: "ready"; chatId: number; name: string };

/** Single-use: the row is marked spent in the same statement that reads it. */
export async function claimTelegramLogin(code: string): Promise<ClaimResult> {
  if (!supabaseAdmin || !/^[A-Z2-9]{6}$/.test(code)) return { state: "expired" };

  const { data } = await supabaseAdmin
    .from("telegram_logins")
    .update({ consumed_at: new Date().toISOString() })
    .eq("code", code)
    .not("chat_id", "is", null)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("chat_id, display_name")
    .maybeSingle();

  if (data) {
    return {
      state: "ready",
      chatId: Number(data.chat_id),
      name: (data.display_name as string) ?? "",
    };
  }

  // Either the bot has not heard from them yet, or the code is spent or stale.
  const { data: row } = await supabaseAdmin
    .from("telegram_logins")
    .select("consumed_at, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (!row || row.consumed_at || new Date(row.expires_at as string) <= new Date()) {
    return { state: "expired" };
  }
  return { state: "waiting" };
}

/**
 * Turns a Telegram chat into a Supabase session.
 *
 * Supabase has no Telegram provider and has not had one since it was first
 * asked for, so the account is addressed by a synthetic email nobody can
 * receive mail at, and the session is minted the way Supabase mints one for a
 * magic link — generated on the server and consumed immediately, so the link
 * never leaves the process.
 *
 * Nothing downstream changes: this produces the same session the email door
 * produces, so every row policy and ownership filter behaves identically.
 */
export async function signInWithTelegram(
  chatId: number,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: "unavailable" };

  const email = `tg${chatId}@telegram.flex.local`;

  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { telegram_chat_id: chatId, telegram_name: name },
  });

  // Already there is the normal case on every sign-in after the first.
  if (createError && !/already|exists|registered/i.test(createError.message)) {
    return { ok: false, error: createError.message };
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return { ok: false, error: error?.message ?? "no token" };

  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "unavailable" };

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (verifyError) return { ok: false, error: verifyError.message };
  return { ok: true };
}
