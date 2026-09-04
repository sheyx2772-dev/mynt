import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

// Handing a handle to someone else.
//
// The offer is made to an email address, not to an account: the buyer usually
// does not have one yet, and requiring them to register before the seller can
// even make the offer puts the hardest step first.

export type Transfer = {
  id: string;
  handle: string;
  toEmail: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  createdAt: string;
  expiresAt: string;
};

export type TransferResult = { ok: true } | { ok: false; error: string };

const COLUMNS = "id, handle, to_email, status, created_at, expires_at";

function rowToTransfer(row: Record<string, unknown>): Transfer {
  return {
    id: row.id as string,
    handle: row.handle as string,
    toEmail: row.to_email as string,
    status: row.status as Transfer["status"],
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
  };
}

/** Offers made on this handle, newest first. Owners see their own history. */
export async function listTransfersForHandle(handle: string): Promise<Transfer[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("handle_transfers")
    .select(COLUMNS)
    .eq("handle", handle)
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []).map(rowToTransfer);
}

/** Offers waiting for this person to accept. */
export async function listIncomingTransfers(email: string): Promise<Transfer[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("handle_transfers")
    .select(COLUMNS)
    .eq("to_email", email.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return (data ?? []).map(rowToTransfer);
}

export async function offerTransfer(
  userId: string,
  userEmail: string,
  handle: string,
  rawEmail: string
): Promise<TransferResult> {
  const toEmail = rawEmail.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return { ok: false, error: "Elektron pochta manzili noto'g'ri." };
  }
  if (toEmail === userEmail.trim().toLowerCase()) {
    return { ok: false, error: "Handle allaqachon sizniki." };
  }

  if (!supabaseAdmin) return { ok: false, error: "Baza bilan aloqa yo'q." };

  // Ownership is a filter on the write, as everywhere else: a handle that is
  // not theirs matches no row rather than being trusted and checked after.
  const { data: owned } = await supabaseAdmin
    .from("handles")
    .select("normalized")
    .eq("normalized", handle)
    .eq("user_id", userId)
    .maybeSingle();

  if (!owned) return { ok: false, error: "Bu handle sizniki emas." };

  const { error } = await supabaseAdmin
    .from("handle_transfers")
    .insert({ handle, from_user_id: userId, to_email: toEmail });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Bu handle uchun taklif allaqachon yuborilgan." };
    }
    return { ok: false, error: "Taklif saqlanmadi. Birozdan keyin urinib ko'ring." };
  }

  return { ok: true };
}

export async function cancelTransfer(userId: string, id: string): Promise<TransferResult> {
  if (!supabaseAdmin) return { ok: false, error: "Baza bilan aloqa yo'q." };

  const { data } = await supabaseAdmin
    .from("handle_transfers")
    .update({ status: "cancelled", settled_at: new Date().toISOString() })
    .eq("id", id)
    .eq("from_user_id", userId)
    .eq("status", "pending")
    .select("handle")
    .maybeSingle();

  if (!data) return { ok: false, error: "Taklif topilmadi." };
  return { ok: true };
}

export async function acceptTransfer(
  userId: string,
  userEmail: string,
  id: string
): Promise<{ ok: true; handle: string } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: "Baza bilan aloqa yo'q." };

  // The address on the offer has to be this person's, checked here rather than
  // trusted from the form: the id alone is not proof the offer was for them.
  const { data: offer } = await supabaseAdmin
    .from("handle_transfers")
    .select("id, to_email, status")
    .eq("id", id)
    .maybeSingle();

  if (!offer || offer.to_email !== userEmail.trim().toLowerCase()) {
    return { ok: false, error: "Taklif topilmadi." };
  }
  if (offer.status !== "pending") {
    return { ok: false, error: "Bu taklif allaqachon yopilgan." };
  }

  // The handle changing owner, the profile emptying and the previous owner's
  // posts going with them are one transaction inside the database.
  const { data: handle, error } = await supabaseAdmin.rpc("accept_handle_transfer", {
    transfer_id: id,
    new_owner: userId,
  });

  if (error || !handle) {
    return { ok: false, error: "Taklif muddati o'tgan yoki allaqachon yopilgan." };
  }

  return { ok: true, handle: handle as string };
}
