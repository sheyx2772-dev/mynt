import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/rate-limit";
import type { VisitSource } from "@/lib/analytics";

// Contacts sent back to a profile by the people who opened it.
//
// This is the reverse of everything else on the card: instead of the owner
// handing over their details, the visitor leaves theirs. It is the one feature
// that turns a card into something that earns its price in a single meeting,
// and it is the feature the whole international market puts behind payment.

export type Lead = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  note: string | null;
  source: VisitSource | null;
  createdAt: string;
};

export type LeadInput = {
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  note: string | null;
};

// A public form on a page anyone can open. Two windows, both an hour: one per
// address so a script cannot fill a profile with noise, one per profile so it
// cannot be buried even from many addresses.
const PER_IP_PER_HOUR = 10;
const PER_HANDLE_PER_HOUR = 40;
const WINDOW_MS = 60 * 60 * 1000;

const PHONE = /^[0-9+()\- ]{7,30}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function readLeadForm(formData: FormData): { ok: true; lead: LeadInput } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) return { ok: false, error: "Ismingizni yozing." };

  const rawPhone = String(formData.get("phone") ?? "").trim().slice(0, 30);
  const rawEmail = String(formData.get("email") ?? "").trim().slice(0, 120);

  const phone = rawPhone && PHONE.test(rawPhone) ? rawPhone : null;
  const email = rawEmail && EMAIL.test(rawEmail) ? rawEmail.toLowerCase() : null;

  // The database refuses a row with neither, and says so here in words the
  // person can act on rather than as a failed insert.
  if (!phone && !email) {
    if (rawPhone || rawEmail) {
      return { ok: false, error: "Telefon yoki emailni tekshiring." };
    }
    return { ok: false, error: "Telefon yoki email — bittasi kerak." };
  }

  return {
    ok: true,
    lead: {
      name,
      phone,
      email,
      company: String(formData.get("company") ?? "").trim().slice(0, 80) || null,
      note: String(formData.get("note") ?? "").trim().slice(0, 500) || null,
    },
  };
}

export async function saveLead(
  normalized: string,
  lead: LeadInput,
  source: VisitSource | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: "Hozir yuborib bo'lmadi." };

  const ip = await getClientIp();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const [{ count: ipCount }, { count: handleCount }] = await Promise.all([
    supabaseAdmin
      .from("lead_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip ?? "")
      .gte("created_at", since),
    supabaseAdmin
      .from("lead_attempts")
      .select("id", { count: "exact", head: true })
      .eq("handle", normalized)
      .gte("created_at", since),
  ]);

  if ((ipCount ?? 0) >= PER_IP_PER_HOUR || (handleCount ?? 0) >= PER_HANDLE_PER_HOUR) {
    // Counted as well, so hammering the limit does not reset it.
    await supabaseAdmin.from("lead_attempts").insert({ ip, handle: normalized });
    return { ok: false, error: "Juda ko'p urinish. Biroz kutib, qayta yuboring." };
  }

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id")
    .eq("normalized", normalized)
    .eq("status", "claimed")
    .maybeSingle();

  if (!handle) return { ok: false, error: "Bu profil topilmadi." };

  const { error } = await supabaseAdmin.from("leads").insert({
    handle_id: handle.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    company: lead.company,
    note: lead.note,
    source,
  });

  await supabaseAdmin
    .from("lead_attempts")
    .insert({ ip, handle: normalized, succeeded: !error });

  if (error) return { ok: false, error: "Hozir yuborib bo'lmadi. Keyinroq urinib ko'ring." };
  return { ok: true };
}

/** What one owner has been sent. The ownership filter is the authorization. */
export async function listLeads(normalized: string, userId: string): Promise<Lead[]> {
  if (!supabaseAdmin) return [];

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id")
    .eq("normalized", normalized)
    .eq("user_id", userId)
    .maybeSingle();

  if (!handle) return [];

  const { data } = await supabaseAdmin
    .from("leads")
    .select("id, name, phone, email, company, note, source, created_at")
    .eq("handle_id", handle.id)
    .order("created_at", { ascending: false })
    .limit(500);

  return (data ?? []).map((row) => ({
    id: row.id as number,
    name: row.name as string,
    phone: (row.phone as string) ?? null,
    email: (row.email as string) ?? null,
    company: (row.company as string) ?? null,
    note: (row.note as string) ?? null,
    source: (row.source as VisitSource) ?? null,
    createdAt: row.created_at as string,
  }));
}
