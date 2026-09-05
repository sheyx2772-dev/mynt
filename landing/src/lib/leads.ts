import "server-only";


import type { VisitSource } from "@/lib/analytics";
import { asReader, backend } from "@/lib/backend/client";

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
  const { response, error } = await backend.POST("/profil/{raqam}/vizitka", {
    params: { path: { raqam: normalized } },
    body: {
      ism: lead.name,
      telefon: lead.phone ?? undefined,
      email: lead.email ?? undefined,
      kompaniya: lead.company ?? undefined,
      izoh: lead.note ?? undefined,
      manba: source ?? undefined,
    },
  });

  if (!error) return { ok: true };

  // The two the visitor can act on. Everything else is the same apology,
  // because there is nothing they could do differently.
  if (response.status === 429) {
    return { ok: false, error: "Juda ko'p urinish. Biroz kutib, qayta yuboring." };
  }
  if (response.status === 404) {
    return { ok: false, error: "Bu profil topilmadi." };
  }
  return { ok: false, error: "Hozir yuborib bo'lmadi. Keyinroq urinib ko'ring." };
}

/** What one owner has been sent. The ownership filter is the authorization. */
export async function listLeads(normalized: string): Promise<Lead[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/vizitkalar", {
    params: { path: { raqam: normalized } },
  });
  if (error || !data) return [];

  return (data.vizitkalar ?? []).map((l) => ({
    id: l.id,
    name: l.ism,
    phone: l.telefon ?? null,
    email: l.email ?? null,
    company: l.kompaniya ?? null,
    note: l.izoh ?? null,
    source: (l.manba as VisitSource) ?? null,
    createdAt: l.vaqt,
  }));
}

