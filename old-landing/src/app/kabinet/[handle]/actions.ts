"use server";

import { revalidatePath } from "next/cache";
import { writePost, removePost } from "@/lib/posts";
import { parseHandle } from "@/lib/pricing";
import { getUser } from "@/lib/auth";
import { saveProfile } from "@/lib/profile-save";
import { requestDesign } from "@/lib/design-requests";
import { offerTransfer, cancelTransfer, acceptTransfer } from "@/lib/transfers";

export type UpdateResult = {
  ok: boolean;
  error?: string;
  saved?: true;
  /** Saved, but the picture did not reach the store. See readProfileForm. */
  imageFailed?: true;
};

export async function updateProfile(
  rawHandle: string,
  _prevState: UpdateResult,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam 3 harf va 3 raqamdan iborat bo'lishi kerak." };

  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  // The write itself lives in `@/lib/profile-save`, which the mobile route
  // also calls. What is left here is the half that is particular to a form
  // posted from this page: who the cookie says is asking, and the shape
  // `useActionState` expects back.
  const result = await saveProfile(`${parsed.letters}${parsed.digits}`, formData);
  if (!result.ok) return { ok: false, error: result.error };

  return { ok: true, saved: true, ...(result.imageFailed ? { imageFailed: true as const } : {}) };
}

export type PostResult = { ok: boolean; error?: string };

const POST_ERRORS: Record<string, string> = {
  empty: "Post matnini yozing.",
  tooMany: "Bir soatda juda ko'p post. Birozdan so'ng urining.",
  notOwned: "Bu handle sizga tegishli emas.",
  failed: "Post saqlanmadi. Qaytadan urinib ko'ring.",
};

export async function createPost(
  rawHandle: string,
  _prevState: PostResult,
  formData: FormData
): Promise<PostResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam 3 harf va 3 raqamdan iborat bo'lishi kerak." };

  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await writePost(normalized, String(formData.get("body") ?? ""));
  if (!result.ok) return { ok: false, error: POST_ERRORS[result.error] };

  revalidateAround(normalized);
  return { ok: true };
}

export async function deletePost(postId: string): Promise<PostResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  // Somebody else's post matches nothing, so it reads as missing rather than
  // as refused — a refusal would confirm it exists.
  const handle = await removePost(postId);
  if (!handle) return { ok: false, error: "Post topilmadi." };

  revalidateAround(handle);
  return { ok: true };
}

// The three places a post shows: the profile, its own tab in the cabinet, and
// the feed of everybody following that number.
function revalidateAround(handle: string): void {
  revalidatePath(`/${handle}`);
  revalidatePath(`/kabinet/${handle}/postlar`);
  revalidatePath("/lenta");
}

export type DesignRequestResult = { ok: boolean; error?: string; queued?: true };

export async function submitDesignRequest(
  rawHandle: string,
  _prevState: DesignRequestResult,
  formData: FormData
): Promise<DesignRequestResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam 3 harf va 3 raqamdan iborat bo'lishi kerak." };
  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  const wish = String(formData.get("wish") ?? "");
  const result = await requestDesign(normalized, wish);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/kabinet/${normalized}/dizayn`);
  return { ok: true, queued: true };
}

export type TransferActionResult = { ok: boolean; error?: string; sent?: true };

export async function offerHandleTransfer(
  rawHandle: string,
  _prevState: TransferActionResult,
  formData: FormData
): Promise<TransferActionResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam 3 harf va 3 raqamdan iborat bo'lishi kerak." };
  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user?.email) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await offerTransfer(
    normalized,
    String(formData.get("email") ?? "").trim().toLowerCase(),
  );
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/kabinet/${normalized}/otkazish`);
  return { ok: true, sent: true };
}

export async function cancelHandleTransfer(id: string): Promise<TransferActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await cancelTransfer(id);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/kabinet");
  return { ok: true };
}

export async function acceptHandleTransfer(id: string): Promise<TransferActionResult> {
  const user = await getUser();
  if (!user?.email) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await acceptTransfer(id);
  if (!result.ok) return { ok: false, error: result.error };

  // The number changed hands, so both cabinets and the profile itself are
  // stale. The profile path is not known here — the backend moved it — so the
  // cabinet is refreshed and the profile revalidates on its own next request.
  revalidatePath("/kabinet");
  return { ok: true };
}
