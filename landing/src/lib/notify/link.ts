import "server-only";

import { asReader } from "@/lib/backend/client";

// Linking an account to a Telegram chat.
//
// The person asks for a code and sends it to the bot. That direction is the
// only one that works without asking for their phone number: Telegram will not
// tell us who they are, so they tell Telegram who they are on our behalf.
//
// The code is issued, spent and expired in the backend, which also holds the
// bot token. Nothing here ever sees it — a token on this side would be a token
// in a Vercel environment as well as in the one that actually sends.

// `available` says whether there is a bot at all — a deployment with no token
// has none, and the screen says so rather than offering a button that opens
// onto nothing. It travels with the state because both come from one request:
// asking twice is two round trips for one screen.
export type LinkState = { available: boolean } & (
  | { state: "unavailable" }
  | { state: "linked" }
  | { state: "waiting"; code: string; expiresAt: string }
);

type Wire = { mavjud: boolean; holat: string; kod?: string; tugaydi?: string };

function toState(link: Wire | undefined): LinkState {
  const available = link?.mavjud ?? false;
  if (link?.holat === "linked") return { available, state: "linked" };
  if (link?.holat === "waiting" && link.kod && link.tugaydi) {
    return { available, state: "waiting", code: link.kod, expiresAt: link.tugaydi };
  }
  return { available, state: "unavailable" };
}

export async function getLinkState(): Promise<LinkState> {
  const client = await asReader();
  const { data } = await client.GET("/xabarlar/telegram", {});
  return toState(data?.ulanish);
}

/** Issues a fresh code, replacing any that is still outstanding. */
export async function startLink(): Promise<LinkState> {
  const client = await asReader();
  const { data } = await client.POST("/xabarlar/telegram", {});
  return toState(data?.ulanish);
}

/**
 * Reads what the bot has been sent and completes any link it can.
 *
 * It drains every pending code, not only this person's, because Telegram hands
 * out updates once and reading them for one account would consume another's.
 * The write is matched on the code itself, so draining somebody else's link
 * completes theirs rather than stealing it.
 */
export async function checkLink(): Promise<LinkState> {
  const client = await asReader();
  const { data } = await client.POST("/xabarlar/telegram/tekshirish", {});
  return toState(data?.ulanish);
}
