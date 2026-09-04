import "server-only";

import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { telegramUpdates, telegramChannel, isTelegramConfigured } from "./telegram";

// Linking an account to a Telegram chat.
//
// The person asks the site for a code and sends it to the bot. That direction
// is the only one that works without asking for their phone number or their
// Telegram username — Telegram will not tell us who they are, so they have to
// tell Telegram who they are on our behalf.
//
// The code is a bearer secret while it lives: whoever sends it to the bot
// becomes that account's Telegram. So it is short, random, single-use and
// expires quickly.

const CODE_TTL_MS = 15 * 60 * 1000;

export type LinkState =
  | { state: "unavailable" }
  | { state: "linked"; chatId: number }
  | { state: "waiting"; code: string; expiresAt: string };

export async function getLinkState(userId: string): Promise<LinkState> {
  if (!isTelegramConfigured || !supabaseAdmin) return { state: "unavailable" };

  const { data } = await supabaseAdmin
    .from("notification_settings")
    .select("telegram_chat_id, telegram_link_code, telegram_link_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.telegram_chat_id) {
    return { state: "linked", chatId: data.telegram_chat_id as number };
  }

  const expiry = data?.telegram_link_expires_at as string | undefined;
  if (data?.telegram_link_code && expiry && new Date(expiry) > new Date()) {
    return { state: "waiting", code: data.telegram_link_code as string, expiresAt: expiry };
  }

  return { state: "unavailable" };
}

/** Issues a fresh code, replacing any that is still outstanding. */
export async function startLink(userId: string): Promise<LinkState> {
  if (!isTelegramConfigured || !supabaseAdmin) return { state: "unavailable" };

  // Six characters from an alphabet without the pairs people mistype when they
  // are copying between two screens: no O and 0, no I and 1.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from(randomBytes(6))
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");

  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  const { error } = await supabaseAdmin.from("notification_settings").upsert(
    {
      user_id: userId,
      telegram_link_code: code,
      telegram_link_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { state: "unavailable" };
  return { state: "waiting", code, expiresAt };
}

/**
 * Reads what the bot has been sent and completes any link it can.
 *
 * Polling rather than a webhook, because a webhook needs a public address and
 * the domain is not pointed yet. It runs when somebody is watching the linking
 * screen, which is the only moment it matters — and it is cheap, since Telegram
 * only holds updates the bot has not acknowledged.
 */
export async function drainLinkCodes(): Promise<number> {
  if (!isTelegramConfigured || !supabaseAdmin) return 0;

  const updates = await telegramUpdates();
  if (updates.length === 0) return 0;

  let linked = 0;

  for (const update of updates) {
    // Codes arrive as the whole message, or after /start. Anything else is
    // somebody talking to the bot, which is not an error.
    const code = update.text.trim().replace(/^\/start\s*/i, "").toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) continue;

    const { data } = await supabaseAdmin
      .from("notification_settings")
      .update({
        telegram_chat_id: update.chatId,
        telegram_link_code: null,
        telegram_link_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("telegram_link_code", code)
      .gt("telegram_link_expires_at", new Date().toISOString())
      .select("user_id")
      .maybeSingle();

    if (data) {
      linked += 1;
      await telegramChannel.send(
        {
          userId: data.user_id as string,
          kind: "lead",
          title: "Flex ulandi",
          body: "Endi kontakt kelganda shu yerga xabar beramiz.",
        },
        { telegramChatId: update.chatId, email: null },
      );
    }
  }

  // Acknowledge everything read, so the same messages are not processed again.
  const highest = Math.max(...updates.map((u) => u.updateId));
  await telegramUpdates(highest + 1);

  return linked;
}
