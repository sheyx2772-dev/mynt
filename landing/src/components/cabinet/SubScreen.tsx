import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import CabinetTabs, { type CabinetScreen } from "./CabinetTabs";
import { Link } from "@/i18n/navigation";
import { profileUrl } from "@/lib/site";

// The frame every screen behind a tile sits in.
//
// One file so the way back, the title, the category tabs, and the link to
// the public page are in the same place on every screen.
export default async function SubScreen({
  raqam,
  title,
  hint,
  screen,
  waiting = 0,
  leadsCount = 0,
  children,
}: {
  raqam: string;
  title: string;
  hint?: string;
  screen?: CabinetScreen;
  waiting?: number;
  leadsCount?: number;
  children: ReactNode;
}) {
  const t = await getTranslations("cabinet");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href={`/cabinet/${raqam}`}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
          <span className="font-mono font-medium tracking-[0.12em]">
            {raqam}
          </span>
        </Link>
        <a
          href={profileUrl(raqam)}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("home.view")}
          <ExternalLink aria-hidden className="size-3.5" strokeWidth={2} />
        </a>
      </div>

      {screen && (
        <CabinetTabs
          raqam={raqam}
          active={screen}
          waiting={waiting}
          leadsCount={leadsCount}
        />
      )}

      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {hint && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}

      <div className="mt-6">{children}</div>
    </div>
  );
}
