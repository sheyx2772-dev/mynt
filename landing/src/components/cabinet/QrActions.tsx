"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Action buttons for the QR code subscreen:
// - Copy public URL
// - Download SVG (vector, sharp for printing)
// - Download PNG (high-resolution raster)
export default function QrActions({
  raqam,
  url,
  copyLabel,
  copiedLabel,
  downloadSvgLabel,
  downloadPngLabel,
}: {
  raqam: string;
  url: string;
  copyLabel: string;
  copiedLabel: string;
  downloadSvgLabel: string;
  downloadPngLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(copiedLabel);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center">
      <Button
        type="button"
        variant="secondary"
        onClick={copyUrl}
        className="w-full sm:w-auto"
      >
        {copied ? (
          <Check data-icon="inline-start" className="size-4 text-emerald-500" />
        ) : (
          <Copy data-icon="inline-start" className="size-4" />
        )}
        {copyLabel}
      </Button>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <a href={`/api/qr/${raqam}?download=1`} download={`${raqam}-qr.svg`}>
          <Download data-icon="inline-start" className="size-4" />
          {downloadSvgLabel}
        </a>
      </Button>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <a
          href={`/api/qr/${raqam}?format=png&download=1`}
          download={`${raqam}-qr.png`}
        >
          <Download data-icon="inline-start" className="size-4" />
          {downloadPngLabel}
        </a>
      </Button>
    </div>
  );
}
