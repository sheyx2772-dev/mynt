import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { catalogue } from "@/lib/i18n";
import { terms } from "@/lib/terms";
import { getLang } from "@/lib/lang";
import LangSwitch from "@/components/LangSwitch";
import { COMPANY } from "@/lib/company";
import { DEVICE_TYPES } from "@/lib/devices";
import { formatUZS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Ommaviy oferta va shartlar — flex.com.uz",
  description:
    "Flex xizmatining ommaviy oferta shartlari: narxlar, yetkazib berish, qaytarish va firma rekvizitlari.",
};

// Everything a buyer is entitled to know before paying, on one page: who is
// selling, what they get, when it arrives and what happens if it is faulty.
// The payment providers require most of it; a buyer parting with a month's
// phone bill deserves all of it.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-black/8 py-8">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-flex-black/65">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 py-1.5">
      <dt className="w-48 shrink-0 text-flex-black/45">{label}</dt>
      <dd className="font-tabular">{value}</dd>
    </div>
  );
}


export default async function TermsPage({ searchParams }: PageProps<"/shartlar">) {
  const { til } = await searchParams;
  const lang = await getLang(til);
  const t = terms(lang);
  const c = catalogue(lang);

  const requisiteValues = [
    COMPANY.legalName,
    COMPANY.inn,
    COMPANY.oked,
    COMPANY.bank,
    COMPANY.account,
    COMPANY.mfo,
    COMPANY.address,
  ];
  const contactValues = [COMPANY.contactPerson, COMPANY.phone, COMPANY.email];

  return (
    <PageShell>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t.title}</h1>
        <LangSwitch lang={lang} next="/shartlar" />
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-flex-black/55">{t.intro}</p>

      {/* Stated before anything it could contradict. A buyer and a seller
          reading different words need to know which words they agreed to, and
          this is the sentence that makes a translated contract safe to publish
          at all. */}
      <p className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] px-5 py-4 text-sm leading-relaxed text-flex-black/70">
        {t.authority}
      </p>

      {t.sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {section.title === t.sections[1]!.title && (
            <dl className="mt-4 rounded-2xl border border-black/8 bg-black/[0.02] px-5 py-3">
              {DEVICE_TYPES.map((d) => (
                <Row
                  key={d.id}
                  label={c.devices[d.id].name}
                  value={formatUZS(d.price, lang)}
                />
              ))}
            </dl>
          )}

          {section.title === t.sections[7]!.title && (
            <dl className="rounded-2xl border border-black/8 bg-black/[0.02] px-5 py-3">
              {t.requisites.map((label, i) => (
                <Row key={label} label={label} value={requisiteValues[i]!} />
              ))}
            </dl>
          )}

          {section.title === t.sections[8]!.title && (
            <dl className="rounded-2xl border border-black/8 bg-black/[0.02] px-5 py-3">
              {t.contact.map((label, i) => (
                <Row key={label} label={label} value={contactValues[i]!} />
              ))}
            </dl>
          )}
        </Section>
      ))}
    </PageShell>
  );
}
