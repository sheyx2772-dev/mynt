import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

// A company asking for a team order. Nothing is automated: somebody reads the
// row, calls back and arranges it. At this size that is the right shape — a
// team order needs a conversation about branding, sizes and delivery anyway.

export type TeamRequestResult =
  | { ok: true }
  | { ok: false; error: string; fallback?: true };

export type TeamRequestInput = {
  company: string;
  contactName: string;
  phone: string;
  email: string;
  teamSize: string;
  note: string;
};

/** Digits, spaces and the usual punctuation a person types a number with. */
const PHONE = /^[\d\s+()-]{7,30}$/;

export async function submitTeamRequest(input: TeamRequestInput): Promise<TeamRequestResult> {
  const company = input.company.trim();
  const contactName = input.contactName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const note = input.note.trim();
  const teamSize = Number.parseInt(input.teamSize, 10);

  if (company.length < 2) return { ok: false, error: "Kompaniya nomini kiriting." };
  if (contactName.length < 2) return { ok: false, error: "Ismingizni kiriting." };
  if (!PHONE.test(phone)) return { ok: false, error: "Telefon raqamini to'liq kiriting." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Elektron pochta manzili noto'g'ri." };
  }
  if (!Number.isFinite(teamSize) || teamSize < 1) {
    return { ok: false, error: "Nechta xodim ekanini kiriting." };
  }
  if (teamSize > 100_000) {
    return { ok: false, error: "Bu son juda katta — tekshirib qayta kiriting." };
  }
  if (note.length > 1000) return { ok: false, error: "Izoh juda uzun." };

  // A lead form must never dead-end. If the row cannot be written the visitor
  // is given the phone number rather than an apology, because a company that
  // wanted twenty cards and got an error will not come back.
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi.", fallback: true };

  const { error } = await supabaseAdmin.from("team_requests").insert({
    company,
    contact_name: contactName,
    phone,
    email: email || null,
    team_size: teamSize,
    note: note || null,
  });

  if (error) return { ok: false, error: "Saqlab bo'lmadi.", fallback: true };

  return { ok: true };
}
