import QRCode from "qrcode";
import { parseHandle, parseGenesisSerial } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

// Serves the QR code for a profile, so a printed card works on phones without
// NFC. SVG rather than PNG: it stays sharp at card size and at poster size.
export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;

  const serial = parseGenesisSerial(handle);
  const parsed = parseHandle(handle);
  if (!serial && !parsed) {
    return new Response("Not found", { status: 404 });
  }

  const normalized = serial ?? `${parsed!.letters}${parsed!.digits}`;

  const svg = await QRCode.toString(`${SITE_URL}/${normalized}`, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#0e0a1b", light: "#0000" },
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      // The target URL never changes for a given handle.
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
