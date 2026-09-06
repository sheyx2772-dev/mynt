"use server";

import { revalidatePath } from "next/cache";

import { deleteLead } from "@/lib/cabinet/leads";
import { normalize, ownedHandle } from "@/lib/cabinet/handles";
import { requireAccount } from "@/lib/cabinet/session";

export async function removeLead(
  handle: string,
  id: number,
): Promise<{ ok: boolean }> {
  await requireAccount();
  const raqam = normalize(handle);
  if (!raqam) return { ok: false };

  const owned = await ownedHandle(raqam);
  if (!owned) return { ok: false };

  const ok = await deleteLead(raqam, id);
  if (ok) {
    revalidatePath(`/cabinet/${raqam}/leads`);
  }
  return { ok };
}
