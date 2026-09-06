import type { components } from "@/lib/backend/schema";

// The nine link fields, and how a stored link turns back into one.
//
// The backend does not store what the owner typed. It stores what it built —
// `https://t.me/aziz` from "aziz", `https://wa.me/998901234567` from a phone
// number — and refuses anything it could not build, which is the whole reason
// a profile's links are safe to render to strangers (see BuildLinks in
// `internal/handles/links.go`). So an edit form has to recover the typed value
// from the built one, and it recognises a link by the label the backend gave
// it, because the label is the one part the owner never chose.
//
// This is also why links are not free-form here: no "add a link", no reorder,
// no custom label. The backend's `LinkInput` is nine named fields, and a form
// that offered more would be offering something the server drops on save.
//
// `kind` is matched before the label. Rows written by hand — the seeded
// demo profiles, and anything the old site imported — carry a `kind` and a
// label of their own choosing ("rahimov.capital" rather than "Veb-sayt"), and
// a form that failed to recover one of those would post the profile back
// without it: the link would be silently deleted on the first save.

export type LinkInput = components["schemas"]["LinkInput"];
export type LinkField = keyof LinkInput;
export type StoredLink = components["schemas"]["Link"];

/**
 * The fields in the order the profile shows them, with the label the backend
 * writes and the base it strips to recover a username. `null` base means the
 * field holds a whole address.
 */
export const LINK_FIELDS: {
  field: LinkField;
  label: string;
  base: string | null;
}[] = [
  { field: "payment", label: "To'lash", base: null },
  { field: "booking", label: "Uchrashuv", base: null },
  { field: "telegram", label: "Telegram", base: "https://t.me/" },
  { field: "whatsapp", label: "WhatsApp", base: "https://wa.me/" },
  { field: "instagram", label: "Instagram", base: "https://instagram.com/" },
  { field: "linkedin", label: "LinkedIn", base: "https://linkedin.com/in/" },
  { field: "facebook", label: "Facebook", base: "https://facebook.com/" },
  { field: "youtube", label: "YouTube", base: "https://youtube.com/@" },
  { field: "website", label: "Veb-sayt", base: null },
];

/** A stored link belongs to a field by its kind, failing that by its label. */
function fieldOf(link: StoredLink): LinkField | null {
  const byKind = LINK_FIELDS.find((f) => f.field === link.kind);
  if (byKind) return byKind.field;
  return LINK_FIELDS.find((f) => f.label === link.label)?.field ?? null;
}

/** What the form shows for each field, recovered from what the profile stores. */
export function toLinkInput(links: StoredLink[] | null | undefined): LinkInput {
  const out: LinkInput = {};
  for (const { field, base } of LINK_FIELDS) {
    const link = (links ?? []).find((l) => fieldOf(l) === field);
    if (!link) continue;
    if (base === null) out[field] = link.href;
    // A WhatsApp field asks for a number, and wa.me carries the digits.
    else if (field === "whatsapp")
      out[field] = `+${link.href.slice(base.length)}`;
    else
      out[field] = link.href.startsWith(base)
        ? link.href.slice(base.length)
        : "";
  }
  return out;
}

/** The nine fields out of a submitted form, each cut to what the backend takes. */
export function readLinkInput(get: (name: string) => string): LinkInput {
  const out: LinkInput = {};
  for (const { field } of LINK_FIELDS) {
    const value = get(field).trim().slice(0, 500);
    if (value) out[field] = value;
  }
  return out;
}
