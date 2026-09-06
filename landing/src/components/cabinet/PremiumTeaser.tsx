import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// What the free plan is not shown, said plainly, with the way to it.
export default async function PremiumTeaser() {
  const t = await getTranslations("cabinet.stats");

  return (
    <section className="mt-6 rounded-card border border-border bg-card p-4 sm:p-5">
      {/* Gold is the engraving, and on paper it is a mark rather than a
          text colour: 2.2:1 is not a label anybody can read. */}
      <p className="cap flex items-center gap-2">
        <span aria-hidden className="size-2 rounded-full bg-gold" />
        {t("premiumOnly")}
      </p>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
        <li>{t("premiumDaily")}</li>
        <li>{t("premiumLinks")}</li>
        <li>{t("premiumSources")}</li>
      </ul>
      <Button
        asChild
        variant="outline"
        size="lg"
        className="mt-4 h-11 rounded-input"
      >
        <Link href="/pricing">{t("seePlans")}</Link>
      </Button>
    </section>
  );
}
