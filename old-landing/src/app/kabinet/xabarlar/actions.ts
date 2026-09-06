"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { startLink, checkLink, type LinkState } from "@/lib/notify/link";
import { markAllRead } from "@/lib/notify";

export async function requestTelegramCode(): Promise<LinkState> {
  await requireUser("/kabinet/xabarlar");
  const state = await startLink();
  revalidatePath("/kabinet/xabarlar");
  return state;
}

/** Called by the linking screen while it waits for the code to arrive. */
export async function checkTelegramLink(): Promise<LinkState> {
  await requireUser("/kabinet/xabarlar");
  const state = await checkLink();
  if (state.state === "linked") revalidatePath("/kabinet/xabarlar");
  return state;
}

export async function dismissAll(): Promise<void> {
  await requireUser("/kabinet/xabarlar");
  await markAllRead();
  revalidatePath("/kabinet/xabarlar");
}
