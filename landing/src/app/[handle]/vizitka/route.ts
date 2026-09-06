import { parseHandle, parseGenesisSerial } from "@/lib/pricing";
import { getClaimedProfile } from "@/lib/handles";
import { SITE_URL } from "@/lib/site";

// The contact card, built and served by the server.
//
// It used to be built in the browser: a Blob, an object URL, and a synthetic
// click on an `<a download>`. That works everywhere except the place it
// matters most. iOS Safari treats a blob download inconsistently — often a
// blank tab, sometimes nothing — and iOS is most of the phones that will ever
// tap one of these cards. A response with Content-Disposition is what opens
// the Contacts sheet reliably, on iOS and Android alike.
//
// It also fixes something the client version got wrong: the URL written into
// the card was the literal string "https://flex-nfc.uz/…", which is not the
// address this site is served from. A saved contact carries that link forever.

const esc = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle } = await context.params;

  const serial = parseGenesisSerial(handle);
  const parsed = parseHandle(handle);
  if (!serial && !parsed) return new Response("Not found", { status: 404 });

  const normalized = serial ?? `${parsed!.letters}${parsed!.digits}`;
  const profile = await getClaimedProfile(normalized);
  if (!profile) return new Response("Not found", { status: 404 });

  // Only the fields the owner filled in: an empty TEL makes a phone show a
  // blank number on the saved contact.
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(profile.name ?? normalized)}`,
    profile.phone ? `TEL;TYPE=CELL:${esc(profile.phone)}` : null,
    profile.contactEmail ? `EMAIL;TYPE=INTERNET:${esc(profile.contactEmail)}` : null,
    profile.company ? `ORG:${esc(profile.company)}` : null,
    profile.position ? `TITLE:${esc(profile.position)}` : null,
    profile.bio ? `NOTE:${esc(profile.bio)}` : null,
    `URL:${SITE_URL}/${normalized}`,
    "END:VCARD",
  ].filter((line): line is string => line !== null);

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${normalized}.vcf"`,
      // A profile can be edited at any moment, and a stale contact card is
      // worse than a slow one.
      "Cache-Control": "no-store",
    },
  });
}
