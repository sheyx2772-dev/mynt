import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { money } from "@/lib/devices";
import {
  PERSONAL_MONTHLY,
  PERSONAL_YEARLY,
  TEAM_SEAT_MONTHLY,
  VENUE_ENTRY_MONTHLY,
} from "@/lib/plans";

// Three buyers, and the same three questions asked of each.
//
// A person buying one number, a company buying them for staff, a venue paying
// for tables. They are not tiers of one another — a cafe owner reading a
// column headed "Pro" would spend the whole section working out whether that
// is them — so they are three columns with the same three rows, and the rows
// are what makes them comparable.
//
// The third row is the one that matters and the one nobody else prints: what
// happens when the paying stops. The answer is that the profile keeps opening
// and only editing closes, and saying it here rather than in a policy page is
// the difference between a subscription and a hostage. It also pre-empts the
// question that otherwise arrives by phone, one buyer at a time.
//
// The figures come from `plans.ts`, which the backend bills from. Typing them
// into the markup is how a page ends up advertising a price the server will
// not honour.
const COLUMNS = [
  {
    id: "person",
    start: `${money(100_000)}+`,
    sub: `${money(PERSONAL_MONTHLY)}`,
    href: "/personal",
    lead: true,
  },
  {
    id: "team",
    start: `${money(TEAM_SEAT_MONTHLY)}`,
    sub: `${money(TEAM_SEAT_MONTHLY)}`,
    href: "/business#team",
    lead: false,
  },
  {
    id: "venue",
    start: null,
    sub: `${money(VENUE_ENTRY_MONTHLY)}`,
    href: "/business",
    lead: false,
  },
] as const;

export default async function Pricing() {
  const t = await getTranslations("price");

  return (
    <section id="narx" className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
          {t("title")}
        </h2>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`flex flex-col rounded-tile border p-6 sm:p-7 ${
                col.lead ? "border-ink shadow-card" : "border-line bg-paper/40"
              }`}
            >
              <h3 className="text-xl font-semibold">{t(`${col.id}.name`)}</h3>

              <Row label={t("startLabel")}>
                <Figure>
                  {col.start
                    ? `${col.start} ${t("soum")}`
                    : t(`${col.id}.startFigure`)}
                </Figure>
                <Note>{t(`${col.id}.startNote`)}</Note>
              </Row>

              <Row label={t("subLabel")}>
                <Figure>
                  {col.sub} {t("soum")} / {t("monthly")}
                </Figure>
                <Note>{t(`${col.id}.subNote`)}</Note>
              </Row>

              <Row label={t("lapsedLabel")}>
                <Note>{t(`${col.id}.lapsed`)}</Note>
              </Row>

              <Button
                asChild
                size="lg"
                variant={col.lead ? "default" : "outline"}
                className="mt-7 w-full"
              >
                <Link href={col.href}>{t("cta")}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[13px] text-ink-3">
          {t("yearly", { n: `${money(PERSONAL_YEARLY)} ${t("soum")}` })}
        </p>
      </div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <p className="cap text-ink-3">{label}</p>
      {children}
    </div>
  );
}

function Figure({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 font-medium">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[13px] leading-snug text-ink-3">{children}</p>;
}
