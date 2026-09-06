import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import SubScreen from "@/components/cabinet/SubScreen";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { day } from "@/lib/cabinet/format";
import { planState } from "@/lib/cabinet/plan";
import { openScreen } from "@/lib/cabinet/screen";
import { money } from "@/lib/devices";
import { PERSONAL_MONTHLY } from "@/lib/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("plan.title") };
}

// What is paid for, until when, and what stops.
//
// Everything on this screen is read from the stored row: the tier the
// backend already resolved (a lapsed premium arrives as "free"), the date it
// lapses, what the number cost. Nothing here decides money; the one button
// leads to the pricing page, where the backend prices the order. The list of
// what stops is the same list the pricing page promises, because a person
// who reads "the profile keeps opening" there should read it here too.
export default async function PlanPage({
  params,
}: PageProps<"/[locale]/cabinet/[handle]/plan">) {
  const handle = await openScreen(params);
  const [t, locale] = await Promise.all([
    getTranslations("cabinet.plan"),
    getLocale(),
  ]);
  const plan = planState(handle.tarif, handle.tarif_tugashi);

  return (
    <SubScreen raqam={handle.raqam} title={t("title")}>
      <section
        className={`rounded-tile p-5 sm:p-6 ${plan.tier === "premium" ? "border border-gold/60 bg-card shadow-slab" : "border border-border"}`}
      >
        <p className="cap flex items-center gap-2 text-muted-foreground">
          {plan.tier === "premium" && (
            <span aria-hidden className="size-2 rounded-full bg-gold" />
          )}
          {plan.tier === "premium" ? t("premium") : t("free")}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">
          {plan.tier !== "premium"
            ? t("freeLead")
            : plan.expires
              ? t("until", { date: day(plan.expires.toISOString(), locale) })
              : t("noEnd")}
        </p>
        {plan.daysLeft !== undefined && (
          <p
            className={`mt-1 text-sm ${plan.endingSoon ? "text-warn" : "text-muted-foreground"}`}
          >
            {t("daysLeft", { days: plan.daysLeft })}
          </p>
        )}
        {handle.tolangan ? (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            {t("paidForNumber", { sum: money(handle.tolangan) })}
          </p>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="cap mb-3 text-muted-foreground">{t("whenLapses")}</h2>
        <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <li className="border-t border-border pt-3">{t("lapse.opens")}</li>
          <li className="border-t border-border pt-3">{t("lapse.stats")}</li>
          <li className="border-t border-border pt-3">{t("lapse.services")}</li>
          <li className="border-t border-border pt-3">{t("lapse.keeps")}</li>
        </ul>
      </section>

      {plan.tier !== "premium" && (
        <Button asChild size="lg" className="mt-6 h-12 w-full text-base">
          <Link href="/pricing">
            {t("upgrade", { sum: money(PERSONAL_MONTHLY) })}
          </Link>
        </Button>
      )}
    </SubScreen>
  );
}
