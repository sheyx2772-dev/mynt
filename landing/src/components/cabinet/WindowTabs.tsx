import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { WINDOWS, type Window } from "@/lib/cabinet/stats";

// Seven, thirty, ninety. Links, not buttons: the window is part of the
// address, so each is a page the browser can go back to.
export default async function WindowTabs({
  raqam,
  current,
}: {
  raqam: string;
  current: Window;
}) {
  const t = await getTranslations("cabinet.stats");

  return (
    <nav className="inline-flex rounded-input bg-muted p-1">
      {WINDOWS.map((w) => (
        <Link
          key={w}
          href={{ pathname: `/cabinet/${raqam}/stats`, query: { days: w } }}
          aria-current={w === current ? "page" : undefined}
          className={`flex h-9 items-center rounded-plate px-4 text-sm font-medium transition-colors ${
            w === current
              ? "bg-card text-foreground shadow-slab"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("days", { days: w })}
        </Link>
      ))}
    </nav>
  );
}
