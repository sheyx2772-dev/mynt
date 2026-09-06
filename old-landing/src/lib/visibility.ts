// Who sees which line of a profile.
//
// Kept in step with backend/internal/handles/visibility.go, which is what
// actually decides: the backend cuts the fields before they leave, and this
// file only names the choices for the form and the owner's own page.

export type Audience = "ochiq" | "obuna" | "yopiq";

/** field → audience, open fields absent. Exactly the backend's `korinish`. */
export type Visibility = Record<string, string>;

/** The fields that take an audience, in the order the form shows them. */
export const VISIBLE_FIELDS = [
  "telegram", "instagram", "linkedin", "whatsapp", "facebook", "youtube",
  "payment", "booking", "website", "telefon", "email",
] as const;

export type VisibleField = (typeof VISIBLE_FIELDS)[number];

/** A stored link carries its label; this is the way back to its field. */
export const FIELD_BY_LABEL: Record<string, VisibleField> = {
  "To'lash": "payment", Uchrashuv: "booking", Telegram: "telegram",
  WhatsApp: "whatsapp", Instagram: "instagram", LinkedIn: "linkedin",
  Facebook: "facebook", YouTube: "youtube", "Veb-sayt": "website",
};

export function audienceOf(v: Visibility | undefined, field: string): Audience {
  const a = v?.[field];
  return a === "obuna" || a === "yopiq" ? a : "ochiq";
}

/** The form's `vis_<field>` selects, reduced to the entries that narrow something. */
export function readVisibilityForm(formData: FormData): Visibility {
  const out: Visibility = {};
  for (const field of VISIBLE_FIELDS) {
    const a = String(formData.get(`vis_${field}`) ?? "");
    if (a === "obuna" || a === "yopiq") out[field] = a;
  }
  return out;
}
