import { getTranslations } from "next-intl/server";

import { COMPANY } from "@/lib/company";

// Who is being paid, in the fields a buyer's accountant expects to find them
// in.
//
// Every value comes from `lib/company.ts` — the same constant the footer and
// the offer print — because a tax number that is right on one page and stale
// on another is worse than a page that never showed it. The labels are
// translated; the values are not, because a bank account is the same string in
// every language.
export default async function Requisites() {
  const t = await getTranslations("offer");

  const rows = [
    { label: t("reqCompany"), value: COMPANY.legalName },
    { label: t("reqTaxId"), value: COMPANY.inn, mono: true },
    { label: t("reqOked"), value: COMPANY.oked, mono: true },
    { label: t("reqBank"), value: COMPANY.bank },
    { label: t("reqAccount"), value: COMPANY.account, mono: true },
    { label: t("reqMfo"), value: COMPANY.mfo, mono: true },
    { label: t("reqAddress"), value: COMPANY.address },
  ];

  return (
    <dl className="mt-5 max-w-[65ch] rounded-card border border-line bg-white px-5 py-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-wrap gap-x-4 gap-y-0.5 border-b border-line-soft py-2.5 text-sm last:border-0"
        >
          <dt className="w-40 shrink-0 text-ink-3">{row.label}</dt>
          <dd
            className={
              row.mono
                ? "font-mono tracking-[0.08em] tabular-nums"
                : "text-ink-2"
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
