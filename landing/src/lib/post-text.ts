// A post, broken into the parts that may be rendered.
//
// SECURITY. Post text is written by one person and shown to everybody else, so
// it is the one string on this site that an attacker chooses. Two rules follow,
// and neither is optional.
//
// It is never markup. Every segment below is returned as text and rendered as
// text, which React escapes; `dangerouslySetInnerHTML` appears nowhere near a
// post. A post containing `<script>` is a post that says `<script>`, and a
// stranger tapping a card is never one profile away from a stolen session.
//
// A link is rebuilt, never passed through. The substring that matched is a
// claim about a URL; what reaches `href` is `URL.href` — the address after the
// parser has normalised it — and only when the parse succeeded and the scheme
// is `http:` or `https:`. That is what stops `javascript:` and `data:text/html`
// from becoming an anchor a reader clicks, and it is why the check is a parse
// rather than a `startsWith`: `java\tscript:` and `HTTPS:` are both things a
// string comparison gets wrong and a URL parser does not.
//
// Nothing without a scheme is linked. `arend.uz` in a post stays text, because
// turning it into a link means inventing the `https://` the writer did not
// write — and the moment we are willing to invent part of a URL, the argument
// for which part is a judgement call rather than a rule.

export type Segment =
  { kind: "text"; text: string } | { kind: "link"; text: string; href: string };

/**
 * A candidate, not a URL. Deliberately loose about what follows the scheme —
 * the parser decides, and a regex trying to be the parser is how the second
 * one drifts from the first.
 */
const CANDIDATE = /https?:\/\/[^\s<>"']+/gi;

/**
 * Punctuation that ended the sentence rather than the address.
 *
 * "See https://arend.uz." — the full stop is the writer's, and a link that
 * swallows it goes somewhere slightly wrong. Trimmed from the end only, and
 * only characters that cannot begin a path segment anybody means.
 */
const TRAILING = /[.,;:!?)\]}»"'…]+$/;

export function segments(body: string): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;

  for (const match of body.matchAll(CANDIDATE)) {
    const start = match.index;
    const text = match[0].replace(TRAILING, "");
    const href = safeHref(text);

    // Not a URL after all. Left in the surrounding text run, so the reader
    // still sees exactly what was written — the alternative is silently
    // deleting somebody's words because we could not parse them.
    if (!href) continue;

    if (start > cursor) {
      out.push({ kind: "text", text: body.slice(cursor, start) });
    }
    out.push({ kind: "link", text, href });
    cursor = start + text.length;
  }

  if (cursor < body.length) {
    out.push({ kind: "text", text: body.slice(cursor) });
  }

  return out;
}

/** The address, rebuilt by the parser, or null if there is not one. */
function safeHref(candidate: string): string | null {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  return url.href;
}
