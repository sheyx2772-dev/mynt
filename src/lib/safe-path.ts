// Where to send someone after signing in arrives in a query parameter, which
// means it is attacker-controlled and has to be treated as a place to escape
// from rather than a string to check.
//
// The check this replaces was `startsWith("/") && !startsWith("//")`. A
// backslash walks straight through it: browsers turn `\` into `/` when
// parsing an http(s) URL, so `Location: /\evil.com` is fetched as
// `//evil.com` — a protocol-relative jump to another site.
//
// Parsing is used instead of more string rules because the browser parses
// too, and only the parser knows every form that resolves off-site.

const BASE = "https://mynt.invalid";

export function safePath(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string" || raw === "") return fallback;

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return fallback;
  }

  // Anything absolute, protocol-relative, or backslash-disguised resolves to
  // a different origin than the throwaway base, and is refused.
  if (url.origin !== BASE) return fallback;

  const path = `${url.pathname}${url.search}${url.hash}`;
  return path.startsWith("/") ? path : fallback;
}
