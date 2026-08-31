import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { parseHandle } from "@/lib/pricing";
import { getClaimedProfile } from "@/lib/handles";
import { readVisitorContext, recordLinkClick } from "@/lib/analytics";
import { SITE_URL } from "@/lib/site";

// Counts a link click, then forwards the visitor.
//
// The destination is chosen by index into the profile's own stored links,
// never taken from the query string. A route that redirected to whatever URL
// it was handed would be an open redirect, usable to make a phishing link
// look like it came from flex.uz.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;

  const parsed = parseHandle(handle);
  if (!parsed) return NextResponse.redirect(SITE_URL);

  const normalized = `${parsed.letters}${parsed.digits}`;
  const profile = await getClaimedProfile(normalized);
  if (!profile) return NextResponse.redirect(new URL(`/${normalized}`, request.url));

  const index = Number(request.nextUrl.searchParams.get("to"));
  const link = Number.isInteger(index) ? profile.links[index] : undefined;

  if (!link) return NextResponse.redirect(new URL(`/${normalized}`, request.url));

  const visitor = await readVisitorContext();
  after(() => recordLinkClick(normalized, link.label, visitor));

  // 307 rather than 301: the mapping is not permanent and must not be cached
  // by the browser, or later clicks would never reach us to be counted.
  return NextResponse.redirect(link.href, { status: 307 });
}
