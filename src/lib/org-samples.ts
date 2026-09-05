import { profiles, type Profile } from "@/components/figma/profiles";

/**
 * The organisations, turned into samples for the entry page.
 *
 * The catalogue carries fourteen cards that are an organisation rather than a
 * person — a ministry's own colours, its own logo across the banner, its own
 * published site. On the entry page they answer a question the seven layouts
 * do not: what a card looks like when it belongs to a body someone already
 * recognises.
 *
 * A visitor reading those cards is looking for a person on them, so one is
 * put there — the same invented Aziz Karimov the layout samples already use,
 * on all fourteen, with the "NAMUNA" badge the card already draws. One name
 * repeated down a shelf reads as a placeholder, which is what it is; a
 * different plausible name on each would read as a directory of staff, and
 * that is the thing this catalogue was cleaned of once already. Nothing that
 * belongs to a person is invented: no address, no number, no photograph.
 *
 * The real people in the catalogue are untouched — this builds copies and
 * leaves `profiles` as it is.
 */
export const SAMPLE_NAME = "Aziz Karimov";

/**
 * The five whose catalogue banner is another organisation's logo, inherited
 * from the Figma mock: the innovation centre wears Startup Garage, the
 * hokimiyat wears the prosecutor's office, the finance ministry and Agrobank
 * both wear the Central Bank, and Kapital Bank wears the prosecutor's office
 * too. Checked one by one against the mark in each image.
 *
 * On a shelf on the front page that is a wrong logo printed on a real body's
 * name, so these draw their brand gradient and no artwork until their own
 * logos arrive. Nothing is dropped from the shelf and the catalogue is not
 * touched.
 */
const BORROWED_LOGO = new Set([
  "tashkent-inn",
  "hokimiyat",
  "moliya",
  "agrobank",
  "kapitalbank",
]);

export function hasOwnLogo(id: string): boolean {
  return !BORROWED_LOGO.has(id);
}

const SAMPLE_ROLE = { uz: "Bo'lim boshlig'i", ru: "Начальник отдела" };

export function orgSamples(): Profile[] {
  // The same test the catalogue's own "Tashkilotlar" chip uses: a card with no
  // photograph is a card with no person on it.
  return profiles
    .filter((p) => !p.avatar)
    .map((p) => ({
      ...p,
      name: SAMPLE_NAME,
      fullName: SAMPLE_NAME,
      position: SAMPLE_ROLE.uz,
      positionRu: SAMPLE_ROLE.ru,
      // The avatar circle falls back to these initials. Left as the
      // organisation's mark it would read as the organisation's own page,
      // which is the card this one is deliberately not.
      logoText: "AK",
    }));
}
