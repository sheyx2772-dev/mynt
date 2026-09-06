// Profile links are user-supplied and rendered as clickable anchors on a
// public page, so they are rebuilt from validated parts rather than passed
// through. Kept free of server-only imports so it can be unit tested.

export type Link = {
  label: string;
  href: string;
  /**
   * What kind of thing it is, when that changes how it is drawn. Absent for an
   * ordinary link; "payment" for the one that ends in money, which the profile
   * shows as a button rather than as another row in a list.
   */
  kind?: "payment";
};

// Usernames go straight into a URL path, so they're restricted to the
// characters the platforms actually allow. The hyphen is in the set because
// LinkedIn's public profile slugs are built from it — without it every
// LinkedIn address a person would actually paste is rejected.
const USERNAME = /^[A-Za-z0-9._-]{1,64}$/;

// The second test is the one a port to Go found. A dot is a legal character in
// a username, so USERNAME accepts ".." — and ".." appended to a base address is
// a path segment meaning "up one", which turns "instagram.com/" plus ".." into
// a link to instagram.com itself. Requiring one alphanumeric refuses that, and
// "." and "---" with it, while accepting every username a person actually has.
const HAS_ALPHANUMERIC = /[A-Za-z0-9]/;

export function socialLink(label: string, raw: string, base: string): Link | null {
  const value = raw.trim().replace(/^@/, "");
  if (!value) return null;
  if (!USERNAME.test(value)) return null;
  if (!HAS_ALPHANUMERIC.test(value)) return null;
  return { label, href: `${base}${value}` };
}

export function websiteLink(raw: string): Link | null {
  const value = raw.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  // Anything other than http(s) — javascript:, data:, file: — is rejected
  // rather than rendered as a clickable link on a public profile.
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  // Credentials in the authority let a link read as one host while pointing at
  // another: "https://flex-nfc.uz@evil.com" is a request to evil.com. It is also
  // how a bare "mailto:a@b.com" survives having https:// prepended.
  if (url.username || url.password) return null;

  if (!url.hostname.includes(".")) return null;

  return { label: "Veb-sayt", href: url.toString() };
}

// A WhatsApp link is built from a number, not a username, so it takes the
// digits and drops everything a person types around them. wa.me wants no plus
// and no spaces; giving it any produces a page that says the number is invalid.
export function whatsappLink(raw: string): Link | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return { label: "WhatsApp", href: `https://wa.me/${digits}` };
}

// Booking is whatever the owner uses — Calendly, Google Calendar, a Telegram
// bot — so it is a plain address with a name that says what it does.
export function bookingLink(raw: string): Link | null {
  const link = websiteLink(raw);
  return link ? { label: "Uchrashuv", href: link.href } : null;
}

// The hosts a payment link may point at.
//
// An allowlist rather than a check that it is a URL, and this is the whole
// security argument for the feature: the profile renders this as "pay here" on
// a page anybody can open, so an address the owner chooses freely is a phishing
// page hosted under somebody else's name and our domain. Restricting it to the
// two providers that operate here means the worst a hostile owner can do is
// take their own money.
//
// The same list is enforced in backend/internal/handles/links.go, which is what
// actually decides — this copy is so the form can say no before it is sent.
const PAYMENT_HOSTS = new Set([
  "payme.uz", "www.payme.uz", "p.payme.uz",
  "click.uz", "www.click.uz", "my.click.uz", "m.click.uz",
]);

/**
 * Where somebody pays this profile's owner.
 *
 * Not a merchant checkout of ours — those are built from an order id on the
 * server. This is the owner's own transfer link, the kind Payme and Click give
 * an individual who has no merchant account, which is what almost every barber,
 * tutor and driver has. The money never touches us.
 */
export function paymentLink(raw: string): Link | null {
  const link = websiteLink(raw);
  if (!link) return null;

  try {
    if (!PAYMENT_HOSTS.has(new URL(link.href).hostname.toLowerCase())) return null;
  } catch {
    return null;
  }

  return { label: "To'lash", href: link.href, kind: "payment" };
}

// Builds the ordered link list shown on a profile, dropping anything invalid.
//
// The order is the order they are read in: the ways to talk to a person first,
// then the places to look them up, then their own site. Booking leads because
// it is the one that ends in an appointment.
export function buildProfileLinks(input: {
  payment?: string;
  booking?: string;
  telegram: string;
  whatsapp?: string;
  instagram: string;
  linkedin: string;
  facebook?: string;
  youtube?: string;
  website: string;
}): Link[] {
  return [
    // First, because it is the only one that ends in the owner being paid.
    paymentLink(input.payment ?? ""),
    bookingLink(input.booking ?? ""),
    socialLink("Telegram", input.telegram, "https://t.me/"),
    whatsappLink(input.whatsapp ?? ""),
    socialLink("Instagram", input.instagram, "https://instagram.com/"),
    socialLink("LinkedIn", input.linkedin, "https://linkedin.com/in/"),
    socialLink("Facebook", input.facebook ?? "", "https://facebook.com/"),
    socialLink("YouTube", input.youtube ?? "", "https://youtube.com/@"),
    websiteLink(input.website),
  ].filter((l): l is Link => l !== null);
}

/** The nine fields the edit form has, exactly as the backend names them. */
export type LinkFields = {
  payment?: string;
  booking?: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
};

/**
 * The same nine fields, with everything invalid dropped.
 *
 * The backend stores a profile's links as these raw parts and rebuilds the
 * addresses itself — it will not accept the built `Link[]` that this page
 * renders from. Both shapes are needed, so they are derived here from one set
 * of validators: a field survives this exactly when buildProfileLinks would
 * have produced a row for it.
 */
export function acceptedLinkFields(input: LinkFields): LinkFields {
  const kept: LinkFields = {};
  const take = (key: keyof LinkFields, link: Link | null) => {
    const raw = input[key]?.trim();
    if (raw && link) kept[key] = raw;
  };

  take("payment", paymentLink(input.payment ?? ""));
  take("booking", bookingLink(input.booking ?? ""));
  take("telegram", socialLink("Telegram", input.telegram ?? "", "https://t.me/"));
  take("whatsapp", whatsappLink(input.whatsapp ?? ""));
  take("instagram", socialLink("Instagram", input.instagram ?? "", "https://instagram.com/"));
  take("linkedin", socialLink("LinkedIn", input.linkedin ?? "", "https://linkedin.com/in/"));
  take("facebook", socialLink("Facebook", input.facebook ?? "", "https://facebook.com/"));
  take("youtube", socialLink("YouTube", input.youtube ?? "", "https://youtube.com/@"));
  take("website", websiteLink(input.website ?? ""));

  return kept;
}

// What a link row shows underneath its label: the part a person recognises.
// A full "https://instagram.com/username" in a row is noise — the username is
// the information, and for a website the host is.
export function linkValue(link: Link): string {
  try {
    const url = new URL(link.href);
    const path = url.pathname.replace(/^\/+|\/+$/g, "");

    // A booking address is a whole address, not a name on a known platform:
    // "@aziz" tells nobody whether it opens Calendly or a bot.
    if (link.label === "Veb-sayt" || link.label === "Uchrashuv" || link.kind === "payment") {
      return url.hostname.replace(/^www\./, "") + (path ? `/${path}` : "");
    }

    // wa.me carries a phone number, and a phone number reads as a phone number.
    if (link.label === "WhatsApp") return `+${path}`;

    return path ? `@${path.split("/").pop()}` : url.hostname;
  } catch {
    return link.href;
  }
}
