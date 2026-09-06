import { getTranslations } from "next-intl/server";

import LangSwitch from "@/components/LangSwitch";
import Mark from "@/components/Mark";
import { Link } from "@/i18n/navigation";

// The foot of every page.
//
// Three columns rather than one line, because the business pages are sales
// pages and this is the only place on a marketing site that links to all of
// them. Rather than the long version with the device prices, because those
// prices already live on the devices page — two copies of a number is one
// number that will be wrong.
//
// The legal row is not decoration. An Uzbek company selling online states its
// name and tax number, and a buyer looking for them should not have to open a
// separate page.

// Written here rather than translated: a company name and a tax number are the
// same in every language, and a number in a message file is a number somebody
// will eventually translate.
const LEGAL = {
  company: '"MC LEGAL" AB',
  taxId: "312559000",
  phone: "+998 97 724 79 99",
};

export default async function SiteFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");

  const columns = [
    {
      title: t("product"),
      links: [
        { href: "/personal", label: nav("personal") },
        { href: "/pricing", label: nav("pricing") },
        { href: "/devices", label: t("devices") },
        { href: "/residents", label: nav("residents") },
        { href: "/feed", label: t("posts") },
      ],
    },
    {
      title: t("business"),
      links: [
        { href: "/business", label: t("cafe") },
        { href: "/business#hotels", label: t("hotel") },
        { href: "/business#clinics", label: t("clinic") },
        { href: "/business#teams", label: t("team") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/contact", label: t("contact") },
        { href: "/offer", label: t("offer") },
        { href: "/terms", label: t("terms") },
        { href: "/privacy", label: t("privacy") },
      ],
    },
  ];

  return (
    <footer className="bg-ink px-6 pt-12 pb-9 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Mark tone="dark" />
              flex
            </div>
            <p className="mt-3.5 max-w-[220px] text-[13px] leading-relaxed text-paper-3">
              {t("blurb")}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <div className="cap mb-2.5 text-paper-3">{column.title}</div>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-[5px] text-sm text-paper-2 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-6 border-t border-ink-line pt-5">
          <p className="text-[13px] text-paper-3">
            {LEGAL.company} · {t("taxId")}{" "}
            <span className="font-mono text-xs tracking-[0.14em]">
              {LEGAL.taxId}
            </span>{" "}
            ·{" "}
            <a
              href={`tel:${LEGAL.phone.replace(/\s/g, "")}`}
              className="font-mono text-xs tracking-[0.14em] transition-colors hover:text-paper-2"
            >
              {LEGAL.phone}
            </a>
          </p>
          <LangSwitch tone="dark" />
        </div>
      </div>
    </footer>
  );
}
