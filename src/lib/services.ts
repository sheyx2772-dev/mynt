// The services a profile offers, and what they cost.
//
// A price is free text rather than a number because the honest answer is often
// not one: "kelishilgan holda", "1 soat — 300 000", "500 000 so'mdan". Forcing
// a number would make the field a lie in exactly the cases it matters most.

export type Service = { name: string; price: string | null };

/** The most a card can carry before the list stops being scannable. */
export const MAX_SERVICES = 8;

const NAME_LIMIT = 60;
const PRICE_LIMIT = 40;

export function parseServices(
  rows: readonly { name: string; price: string }[],
): Service[] {
  return rows
    .map((row) => ({
      name: row.name.trim().slice(0, NAME_LIMIT),
      price: row.price.trim().slice(0, PRICE_LIMIT) || null,
    }))
    // A price with nothing priced is not a service, and the database refuses it
    // too. Dropping it here means a half-filled row is simply ignored rather
    // than failing the whole save.
    .filter((s) => s.name.length > 0)
    .slice(0, MAX_SERVICES);
}

export function readServices(value: unknown): Service[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      name: typeof v.name === "string" ? v.name : "",
      price: typeof v.price === "string" && v.price ? v.price : null,
    }))
    .filter((s) => s.name.length > 0)
    .slice(0, MAX_SERVICES);
}
