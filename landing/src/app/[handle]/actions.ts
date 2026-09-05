"use server";

import { asReader } from "@/lib/backend/client";

import { readLeadForm, saveLead } from "@/lib/leads";
import { addComment, deleteComment } from "@/lib/comments";
import { isRecommended, toggleRecommendation } from "@/lib/recommendations";
import { readSource } from "@/lib/analytics";

import { revalidatePath } from "next/cache";
import { parseHandle, priceForHandle } from "@/lib/pricing";
import { isFollowing, setFollowing } from "@/lib/follows";
import { getUser } from "@/lib/auth";
import { getSiteOrigin } from "@/lib/site";
import {   getClientIp } from "@/lib/client-ip";
import { readProfileForm } from "@/lib/profile-form";

// How long a handle is held while the buyer completes payment.
const RESERVATION_MINUTES = 30;

export type Checkout = { click?: string; payme?: string };

export type ClaimResult =
  /**
   * `imageFailed` is a claim that went through with no picture on it. The
   * number is bought and the profile exists, so this is not a failure — but a
   * buyer who chose a photo and was shown none has to be told, or their first
   * act as an owner is wondering whether it worked.
   */
  | { ok: true; checkout?: Checkout; imageFailed?: true }
  | { ok: false; error: string; needsAuth?: true };

export async function claimHandle(
  rawHandle: string,
  _prevState: ClaimResult,
  formData: FormData
): Promise<ClaimResult> {
  // The handle arrives from the client via `.bind`, which means it is
  // attacker-controlled. Re-parse it here instead of trusting the shape the
  // page rendered with — this is the boundary, not the URL.
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam 3 harf va 3 raqamdan iborat bo'lishi kerak." };

  const { letters, digits } = parsed;
  const normalized = `${letters}${digits}`;

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      needsAuth: true,
      error: "Raqam band qilish uchun avval hisobingizga kiring.",
    };
  }

  const read = await readProfileForm(formData, normalized);
  if (!read.ok) return { ok: false, error: read.error };

  // Everything that follows is the backend's: it recomputes the price from the
  // number itself, sweeps a reservation that was never paid for, holds the
  // number, opens the order and builds the payment links. The rate limit is
  // there too — claims are cheap to attempt and expensive to undo, and a cap
  // enforced in the browser's server is a cap enforced where the attempts are
  // not counted.
  const client = await asReader();
  const { data, error, response } = await client.POST("/qidirish/{raqam}/olish", {
    params: { path: { raqam: normalized } },
    body: { ism: read.profile.name },
  });

  if (error || !data?.buyurtma) {
    if (response.status === 429) {
      return { ok: false, error: "Juda ko'p urinish. Birozdan so'ng qayta urining." };
    }
    if (response.status === 409) {
      return { ok: false, error: "Bu raqam allaqachon band." };
    }
    return { ok: false, error: "Hozir band qilib bo'lmadi. Qaytadan urinib ko'ring." };
  }

  const checkout: Checkout = {
    click: data.buyurtma.tolov?.click,
    payme: data.buyurtma.tolov?.payme,
  };

  return {
    ok: true,
    checkout,
    ...(read.imageFailed ? { imageFailed: true as const } : {}),
  };
}

export type FollowResult = { following: boolean; error?: string; needsAuth?: true };

// Follow or unfollow, decided by what is already stored rather than by what
// the client claims the current state is.
export async function toggleFollow(rawHandle: string): Promise<FollowResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { following: false, error: "Raqam 3 harf va 3 raqamdan iborat bo'lishi kerak." };

  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user) {
    return { following: false, needsAuth: true, error: "Obuna uchun hisobingizga kiring." };
  }

  // The backend answers with the state it reached, so a double click leaves the
  // button showing the truth rather than the opposite of it. Following yourself
  // and following a number nobody has claimed are both refused there.
  const current = await isFollowing(normalized);
  const following = await setFollowing(normalized, !current);

  revalidatePath(`/${normalized}`);
  return { following };
}

export type LeadResult = { ok: boolean; error?: string };

/**
 * A visitor sending their own contact back to the profile they are looking at.
 *
 * Open to anyone, including signed-out visitors — the point is that the person
 * holding the card does not have to install anything or make an account. What
 * protects it is validation, the rate limits inside `saveLead`, and the fact
 * that nothing here reads or returns anything: it only writes one row that only
 * the profile's owner can ever read back.
 */
export async function submitLead(
  rawHandle: string,
  rawSource: string | undefined,
  formData: FormData,
): Promise<LeadResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Bu profil topilmadi." };

  const read = readLeadForm(formData);
  if (!read.ok) return { ok: false, error: read.error };

  return saveLead(`${parsed.letters}${parsed.digits}`, read.lead, readSource(rawSource));
}

export type CommentActionResult = { ok: boolean; error?: string; needsAuth?: true };

/** Leaving a comment. Signed in, once per profile, and only where it is open. */
export async function submitComment(
  rawHandle: string,
  body: string,
): Promise<CommentActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, needsAuth: true };

  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Bu profil topilmadi." };

  const normalized = `${parsed.letters}${parsed.digits}`;
  const result = await addComment(normalized, body);
  if (result.ok) revalidatePath(`/${normalized}`);
  return result;
}

/** Removing one. The author may, and so may the profile's owner. */
export async function removeComment(
  rawHandle: string,
  id: number,
): Promise<CommentActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, needsAuth: true };

  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Bu profil topilmadi." };

  const removed = await deleteComment(`${parsed.letters}${parsed.digits}`, id);
  if (!removed.ok) return { ok: false, error: "O'chirilmadi." };

  revalidatePath(`/${parsed.letters}${parsed.digits}`);
  return { ok: true };
}

export type RecommendResult =
  | { ok: true; recommended: boolean }
  | { ok: false; error?: string; needsAuth?: true };

/** One tap, both ways. */
export async function toggleRecommend(rawHandle: string): Promise<RecommendResult> {
  const user = await getUser();
  if (!user) return { ok: false, needsAuth: true };

  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Bu profil topilmadi." };

  const normalized = `${parsed.letters}${parsed.digits}`;

  // The backend answers with the state it reached, so pressing twice quickly
  // does not leave the button showing the opposite of the truth.
  const current = await isRecommended(normalized);
  const result = await toggleRecommendation(normalized, !current);
  if (!result.ok) return { ok: false, error: "Hozir bo'lmadi. Qaytadan urinib ko'ring." };

  revalidatePath(`/${normalized}`);
  return { ok: true, recommended: result.on };
}
