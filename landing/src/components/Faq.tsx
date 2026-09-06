import { getTranslations } from "next-intl/server";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QUESTIONS = [1, 2, 3, 4, 5] as const;

// The five questions.
//
// A `<details>` list came first and was the cheaper thing: it opens with no
// JavaScript, ctrl-F finds text inside a closed one, and a crawler reads every
// answer. This is the shadcn accordion instead, which animates properly and
// matches the panel — and it unmounts a closed answer, so both of those go.
//
// The crawler half is bought back below: the same strings are emitted as
// FAQPage structured data, read from the same keys the accordion renders. Two
// lists would be a page whose visible answers and indexed answers drift, and
// Google withdraws rich results from a site that does that. One source.
//
// Ctrl-F on a closed answer is the part that is simply lost. Five questions is
// short enough that it costs a scroll rather than a search.
export default async function Faq() {
  const t = await getTranslations("faq");

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: QUESTIONS.map((n) => ({
      "@type": "Question",
      name: t(`q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`a${n}`) },
    })),
  };

  return (
    <section
      id="savollar"
      className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16 sm:py-20"
    >
      <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
        {t("title")}
      </h2>

      <Accordion type="single" collapsible className="mt-8">
        {QUESTIONS.map((n) => (
          <AccordionItem key={n} value={`q${n}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {t(`q${n}`)}
            </AccordionTrigger>
            <AccordionContent className="text-[15px] leading-relaxed text-ink-2">
              {t(`a${n}`)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </section>
  );
}
