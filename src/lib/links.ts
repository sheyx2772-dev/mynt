// Profile links are user-supplied and rendered as clickable anchors on a
// public page, so they are rebuilt from validated parts rather than passed
// through. Kept free of server-only imports so it can be unit tested.

export type Link = { label: string; href: string };

// Usernames go straight into a URL path, so they're restricted to the
// characters the platforms actually allow. The hyphen is in the set because
// LinkedIn's public profile slugs are built from it — without it every
// LinkedIn address a person would actually paste is rejected.
const USERNAME = /^[A-Za-z0-9._-]{1,64}$/;

export function socialLink(label: string, raw: string, base: string): Link | null {
  const value = raw.trim().replace(/^@/, "");
  if (!value) return null;
  if (!USERNAME.test(value)) return null;
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
  // another: "https://flex.com.uz@evil.com" is a request to evil.com. It is also
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

// Builds the ordered link list shown on a profile, dropping anything invalid.
//
// The order is the order they are read in: the ways to talk to a person first,
// then the places to look them up, then their own site. Booking leads because
// it is the one that ends in an appointment.
export function buildProfileLinks(input: {
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

// What a link row shows underneath its label: the part a person recognises.
// A full "https://instagram.com/username" in a row is noise — the username is
// the information, and for a website the host is.
export function linkValue(link: Link): string {
  try {
    const url = new URL(link.href);
    const path = url.pathname.replace(/^\/+|\/+$/g, "");

    // A booking address is a whole address, not a name on a known platform:
    // "@aziz" tells nobody whether it opens Calendly or a bot.
    if (link.label === "Veb-sayt" || link.label === "Uchrashuv") {
      return url.hostname.replace(/^www\./, "") + (path ? `/${path}` : "");
    }

    // wa.me carries a phone number, and a phone number reads as a phone number.
    if (link.label === "WhatsApp") return `+${path}`;

    return path ? `@${path.split("/").pop()}` : url.hostname;
  } catch {
    return link.href;
  }
}
