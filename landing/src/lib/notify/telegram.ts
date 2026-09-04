import "server-only";

import type { Channel, Notice, ChannelTarget } from "./types";

// Telegram, because it is what this market actually reads.
//
// A phone app is being built and will take push notifications when it lands,
// but it does not exist yet and will not be installed by everybody when it
// does. Telegram is already on the phone of every business owner here, costs
// nothing per message, and needs no verified domain — which matters, because
// the domain is not pointed yet and transactional email cannot be sent at all.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const isTelegramConfigured = Boolean(TOKEN);

/** Telegram's own markup, on text a stranger typed into a form. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const telegramChannel: Channel = {
  name: "telegram",

  async send(notice: Notice, target: ChannelTarget): Promise<boolean> {
    if (!TOKEN || !target.telegramChatId) return false;

    const lines = [`<b>${escapeHtml(notice.title)}</b>`];
    if (notice.body) lines.push(escapeHtml(notice.body));

    try {
      const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: target.telegramChatId,
          text: lines.join("\n\n"),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        // A notification must never hold up the thing that caused it.
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch {
      // Down, slow, or blocked. The notice is already recorded; losing the
      // delivery is not losing the event.
      return false;
    }
  },
};

/**
 * A plain message from the bot, outside the notification pipeline.
 *
 * The sign-in flow needs to answer a person who is standing in the chat
 * waiting: a bot that receives Start and says nothing reads as broken, and
 * they press it again.
 */
export async function sendTelegramText(chatId: number, text: string): Promise<boolean> {
  if (!TOKEN) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Updates the bot has received, used by the linking flow. */
export async function telegramUpdates(
  offset?: number,
): Promise<{ updateId: number; chatId: number; text: string; from: string }[]> {
  if (!TOKEN) return [];

  try {
    const url = new URL(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
    url.searchParams.set("timeout", "0");
    if (offset) url.searchParams.set("offset", String(offset));

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];

    const data = (await response.json()) as {
      result?: {
        update_id: number;
        message?: { chat?: { id: number }; text?: string; from?: { first_name?: string } };
      }[];
    };

    return (data.result ?? [])
      .filter((u) => u.message?.chat?.id && u.message.text)
      .map((u) => ({
        updateId: u.update_id,
        chatId: u.message!.chat!.id,
        text: u.message!.text!,
        from: u.message!.from?.first_name ?? "",
      }));
  } catch {
    return [];
  }
}
