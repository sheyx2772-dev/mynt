"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getTeamForUser, releaseTeamHandle, assignTeamHandle } from "@/lib/teams";
import { parseHandle } from "@/lib/pricing";
import { issueInvoice } from "@/lib/invoices";
import { MIN_TEAM_SEATS } from "@/lib/plans";

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

export type InvoiceResult = { ok: boolean; error?: string; id?: string };

/**
 * Asking for an invoice.
 *
 * Issuing one is not selling anything — nothing is charged and no plan moves
 * until the transfer lands and somebody settles it. What it does is produce the
 * document the company's accountant needs, with the numbers fixed at the moment
 * it was asked for.
 */
export async function requestInvoice(
  seats: number,
  months: number,
): Promise<InvoiceResult> {
  const user = await requireUser("/kabinet/jamoa");

  const team = await getTeamForUser(user.id);
  if (!team) return { ok: false, error: "Sizda firma hisobi yo'q." };

  if (!Number.isInteger(seats) || seats < MIN_TEAM_SEATS || seats > 500) {
    return { ok: false, error: `O'rinlar soni ${MIN_TEAM_SEATS} dan 500 gacha bo'lsin.` };
  }
  if (![1, 3, 6, 12].includes(months)) {
    return { ok: false, error: "Muddat 1, 3, 6 yoki 12 oy bo'lishi mumkin." };
  }

  const invoice = await issueInvoice(team.id, seats, months);
  if (!invoice) return { ok: false, error: "Hisob-faktura yaratilmadi." };

  revalidatePath("/kabinet/jamoa");
  return { ok: true, id: invoice.id };
}

export type AssignActionResult = { ok: boolean; error?: string; invited?: boolean };

/** Handing one of the company's numbers to a member of staff, by email. */
export async function assignHandle(
  rawHandle: string,
  rawEmail: string,
): Promise<AssignActionResult> {
  const user = await requireUser("/kabinet/jamoa");

  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam noto'g'ri." };

  const email = rawEmail.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Emailni tekshiring." };
  }

  const result = await assignTeamHandle(
    `${parsed.letters}${parsed.digits}`,
    email,
    user.id,
  );

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/kabinet/jamoa");
  return { ok: true, invited: result.invited };
}
