"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { startLink, drainLinkCodes, getLinkState, type LinkState } from "@/lib/notify/link";
import { markAllRead } from "@/lib/notify";

export async function requestTelegramCode(): Promise<LinkState> {
  const user = await requireUser("/kabinet/xabarlar");
  const state = await startLink(user.id);
  revalidatePath("/kabinet/xabarlar");
  return state;
}

/**
 * Called by the linking screen while it waits.
 *
 * It drains every pending code, not only this person's, because Telegram hands
 * out updates once and reading them for one account would consume another's.
 * The write is matched on the code itself, so draining somebody else's link
 * completes theirs rather than stealing it.
 */
export async function checkTelegramLink(): Promise<LinkState> {
  const user = await requireUser("/kabinet/xabarlar");
  await drainLinkCodes();
  const state = await getLinkState(user.id);
  if (state.state === "linked") revalidatePath("/kabinet/xabarlar");
  return state;
}

export async function dismissAll(): Promise<void> {
  const user = await requireUser("/kabinet/xabarlar");
  await markAllRead(user.id);
  revalidatePath("/kabinet/xabarlar");
}
