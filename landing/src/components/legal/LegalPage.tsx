import { LEGAL_UPDATED, legalDate, type LegalSection } from "@/lib/legal";
import LegalToc from "./LegalToc";

// The shell every legal page on this site wears.
//
// A contract is the one page a visitor arrives at already unwilling to read,
// so the shape does the persuading: what it says in a sentence, then what
// governs a disagreement, then numbered parts they can jump between and link
// somebody to. The wall of text everybody ships is the same words nobody gets
// through.
export default function LegalPage({
  title,
  lead,
  updatedLabel,
  locale,
  tocLabel,
  authority,
  sections,
}: {
  title: string;
  lead: string;
  updatedLabel: string;
  locale: string;
  tocLabel: string;
  authority?: string;
  sections: LegalSection[];
}) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h1 className="text-[34px] leading-10 font-semibold tracking-tight sm:text-[42px] sm:leading-[3rem]">
          {title}
        </h1>

        <p className="cap mt-4 text-ink-3">
          {updatedLabel}{" "}
          {/* The machine-readable date is the ISO one and the visible date is
              the reader's; a `datetime` carrying "6-sentabr, 2026" is a date
              nothing can parse. */}
          <time dateTime={LEGAL_UPDATED} className="font-mono tracking-[0.1em]">
            {legalDate(locale)}
          </time>
        </p>

        {/* The whole document in one paragraph, before the document. Somebody
            who reads only this should still come away knowing what they
            agreed to — it is a summary, and the numbered parts below are what
            actually binds. */}
        <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-ink-2">
          {lead}
        </p>

        {authority && (
          // Stated before anything it could contradict. A buyer and a seller
          // reading different words need to know which words they agreed to,
          // and this is the sentence that makes a translated contract safe to
          // publish at all.
          <p className="mt-6 max-w-[65ch] rounded-card border border-line bg-white px-5 py-4 leading-relaxed text-ink-2">
            {authority}
          </p>
        )}

        <div className="mt-12 gap-12 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
          <LegalToc label={tocLabel} sections={sections} />

          <div>
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="border-t border-line py-8 first:border-0 first:pt-0"
              >
                <h2 className="flex gap-3 text-xl font-semibold tracking-tight">
                  {/* The number is the handle people quote — "clause 4" in a
                      message to support. Monospace so the column stays put
                      once the list reaches ten. */}
                  <span className="font-mono text-base font-normal text-ink-3 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>

                <div className="mt-3 max-w-[65ch] space-y-3 leading-relaxed text-ink-2">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {section.extra}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
