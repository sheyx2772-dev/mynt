"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getTeamForUser, releaseTeamHandle } from "@/lib/teams";
import { parseHandle } from "@/lib/pricing";

export type ReleaseResult = { ok: boolean; error?: string };

/**
 * Taking a number back off a leaver.
 *
 * The check that matters is inside the database function, which matches the
 * handle to a company the caller administers; this only refuses obviously bad
 * input early and reports the outcome in words.
 */
export async function releaseHandle(rawHandle: string): Promise<ReleaseResult> {
  const user = await requireUser("/kabinet/jamoa");

  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam noto'g'ri." };

  const team = await getTeamForUser(user.id);
  if (!team) return { ok: false, error: "Sizda firma hisobi yo'q." };

  const released = await releaseTeamHandle(`${parsed.letters}${parsed.digits}`, user.id);
  if (!released) return { ok: false, error: "Bu raqam firmangizga tegishli emas." };

  revalidatePath("/kabinet/jamoa");
  return { ok: true };
}
