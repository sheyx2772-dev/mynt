"use server";

import { revalidatePath } from "next/cache";

import { normalize, ownedHandle } from "@/lib/cabinet/handles";
import { requireAccount } from "@/lib/cabinet/session";
import {
  cancelTransfer as cancelTransferCall,
  offerTransfer as offerTransferCall,
} from "@/lib/cabinet/transfers";

export async function createTransfer(
  handle: string,
  target: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAccount();
  const raqam = normalize(handle);
  if (!raqam) return { ok: false, error: "Raqam noto'g'ri." };

  const owned = await ownedHandle(raqam);
  if (!owned) return { ok: false, error: "Bu raqam sizniki emas." };

  const res = await offerTransferCall(raqam, target);
  if (res.ok) {
    revalidatePath(`/cabinet/${raqam}/transfer`);
  }
  return res;
}

export async function cancelTransfer(
  handle: string,
  id: string,
): Promise<{ ok: boolean }> {
  await requireAccount();
  const raqam = normalize(handle);
  if (!raqam) return { ok: false };

  const owned = await ownedHandle(raqam);
  if (!owned) return { ok: false };

  const ok = await cancelTransferCall(id);
  if (ok) {
    revalidatePath(`/cabinet/${raqam}/transfer`);
  }
  return { ok };
}
