import QRCode from "qrcode";
import { normalize } from "@/lib/cabinet/handles";
import { profileUrl } from "@/lib/site";

// Generates QR code for a public profile.
//
// Defaults to SVG for crystal clear vector rendering at any scale.
// Also supports PNG via ?format=png for direct saving or sharing.
// ?src=qr ensures traffic from camera scans is measured separately from NFC taps.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const raqam = normalize(handle);
  if (!raqam) {
    return new Response("Not found", { status: 404 });
  }

  const url = `${profileUrl(raqam)}?src=qr`;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const isDownload = searchParams.get("download") === "1";

  if (format === "png") {
    const pngBuffer = await QRCode.toBuffer(url, {
      type: "png",
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        ...(isDownload
          ? {
              "Content-Disposition": `attachment; filename="${raqam}-qr.png"`,
            }
          : {}),
      },
    });
  }

  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#0f172a", light: "#00000000" },
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
      ...(isDownload
        ? {
            "Content-Disposition": `attachment; filename="${raqam}-qr.svg"`,
          }
        : {}),
    },
  });
}
