// Profile links are user-supplied and rendered as clickable anchors on a
// public page, so they are rebuilt from validated parts rather than passed
// through. Kept free of server-only imports so it can be unit tested.

export type Link = { label: string; href: string };

// Usernames go straight into a URL path, so they're restricted to the
// characters the platforms actually allow.
const USERNAME = /^[A-Za-z0-9._]{1,64}$/;

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
  // another: "https://mynt.uz@evil.com" is a request to evil.com. It is also
  // how a bare "mailto:a@b.com" survives having https:// prepended.
  if (url.username || url.password) return null;

  if (!url.hostname.includes(".")) return null;

  return { label: "Veb-sayt", href: url.toString() };
}

// Builds the ordered link list shown on a profile, dropping anything invalid.
export function buildProfileLinks(input: {
  telegram: string;
  instagram: string;
  website: string;
}): Link[] {
  return [
    socialLink("Telegram", input.telegram, "https://t.me/"),
    socialLink("Instagram", input.instagram, "https://instagram.com/"),
    websiteLink(input.website),
  ].filter((l): l is Link => l !== null);
}
