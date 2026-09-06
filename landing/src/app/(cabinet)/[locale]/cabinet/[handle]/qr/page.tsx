import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import QrActions from "@/components/cabinet/QrActions";
import SubScreen from "@/components/cabinet/SubScreen";
import { openScreen } from "@/lib/cabinet/screen";
import { profileUrl, SITE_HOST } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("qr.title") };
}

// The QR code screen.
//
// Shows the profile's dedicated QR code for smartphones without NFC.
// Provides instant options to copy the clean public URL or download
// print-ready vector SVG and high-resolution PNG assets.
export default async function QrPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const handle = await openScreen(params);
  const t = await getTranslations("cabinet.sections.qr");
  const fullUrl = profileUrl(handle.raqam);

  return (
    <SubScreen
      raqam={handle.raqam}
      title={t("title")}
      hint={t("hint")}
    >
      <div className="flex flex-col items-center rounded-card border border-border bg-card p-6 text-center sm:p-8">
        <div className="relative mx-auto flex size-64 max-w-full items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr/${handle.raqam}`}
            alt={`${handle.raqam} QR-kod`}
            className="size-full object-contain"
          />
        </div>

        <p className="mt-4 font-mono text-sm text-muted-foreground">
          {SITE_HOST}/{handle.raqam}
        </p>

        <div className="mt-6 w-full">
          <QrActions
            raqam={handle.raqam}
            url={fullUrl}
            copyLabel={t("copy")}
            copiedLabel={t("copied")}
            downloadSvgLabel={t("downloadSvg")}
            downloadPngLabel={t("downloadPng")}
          />
        </div>
      </div>
    </SubScreen>
  );
}
