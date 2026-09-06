/**
 * Everything a stranger can press on a profile, rebuilt from parts we checked.
 *
 * A profile is filled in by its owner and read by people who have never met
 * them. `havolalar[].href` is therefore attacker-controlled text that this site
 * renders into an `href` on a page other people open — and `javascript:` in an
 * href is script running on our origin, under our address, in front of somebody
 * who trusted a card. That is the whole attack, and it costs one allowlist to
 * refuse: four schemes are useful on a business card, everything else is
 * dropped and the row is not drawn at all.
 *
 * `data:` is on the wrong side of that line even though it looks harmless —
 * `data:text/html,…` navigated to from a link is a page we appear to have
 * served. `file:`, `intent:` and the rest are refused for having no business
 * being on a public profile.
 *
 * The visible text is never the raw string either: it is assembled from the
 * parsed URL's own parts, so a label cannot be dressed up as something it is
 * not by burying characters in the address.
 */

const ACTION_SCHEMES = new Set(["https:", "http:", "tel:", "mailto:"]);

function parse(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    // Relative, empty, or not a URL at all. Nothing to render.
    return null;
  }
}

/**
 * The href for a row a visitor can tap, or null if there is no safe one.
 *
 * `url.href` rather than the input: what comes back is the browser's own
 * serialisation of what we parsed, so the string in the attribute and the place
 * the tap lands cannot disagree.
 */
export function actionHref(raw: string): string | null {
  const url = parse(raw);
  if (!url || !ACTION_SCHEMES.has(url.protocol)) return null;

  // "https://flex.uz@evil.example" is a request to evil.example wearing our
  // hostname. Nobody's real link carries credentials, so refusing them costs
  // nothing and closes the disguise.
  if (url.username || url.password) return null;

  return url.href;
}

/**
 * An image address, which is a narrower question than a link.
 *
 * Avatars and card artwork are `src` attributes, and `src` has no use for
 * `tel:` or `mailto:`. Held to http(s) so a broken or hostile value renders as
 * no picture rather than as a request the page makes on the reader's behalf.
 */
export function imageSrc(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  const url = parse(trimmed);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:"))
    return null;
  if (url.username || url.password) return null;
  if (url.pathname.startsWith("/uploads/")) {
    return url.pathname;
  }
  return url.href;
}

/** What the row reads under its label — the address, made short and honest. */
export function linkText(href: string): string {
  const url = parse(href);
  if (!url) return "";

  if (url.protocol === "tel:" || url.protocol === "mailto:") {
    return decodeURIComponent(url.pathname);
  }

  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.hostname.replace(/^www\./, "")}${path}`;
}

/** A phone number as something a phone can dial. */
export function telHref(phone: string): string | null {
  // Rebuilt from the digits the owner typed, plus the leading `+` if it was
  // there. Spaces and brackets are how people write a number, not part of it,
  // and a `tel:` with them in is a link that some dialers refuse.
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}

/** An email address as something a mail app can open. */
export function mailHref(email: string): string | null {
  const value = email.trim();
  // Deliberately not an RFC 5322 parser: this only has to be sure the string
  // is one address and cannot carry a second header or a scheme of its own.
  if (!/^[^\s@,;:<>"]+@[^\s@,;:<>"]+\.[^\s@,;:<>"]+$/.test(value)) return null;
  return `mailto:${encodeURIComponent(value).replace(/%40/, "@")}`;
}
