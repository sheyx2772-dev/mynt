import QRCode from "qrcode";
import { parseHandle, parseGenesisSerial } from "@/lib/pricing";
import { pointUrl } from "@/lib/site";

// Serves the QR code for a profile, so a printed card works on phones without
// NFC. SVG rather than PNG: it stays sharp at card size and at poster size.
export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;

  const serial = parseGenesisSerial(handle);
  const parsed = parseHandle(handle);
  if (!serial && !parsed) {
    return new Response("Not found", { status: 404 });
  }

  const normalized = serial ?? `${parsed!.letters}${parsed!.digits}`;

  // A tag on a table is not the same tag as the one on a card: it has to say
  // which table it is stuck to, or every request it produces arrives from
  // nowhere.
  const { searchParams } = new URL(request.url);
  const point = searchParams.get("stol") ?? searchParams.get("xona");
  const url = pointUrl(normalized, point, "qr");

  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#0e0a1b", light: "#0000" },
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      // The target never changes for a given handle and point.
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
