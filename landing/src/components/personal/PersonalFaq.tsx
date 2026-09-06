import { getTranslations } from "next-intl/server";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QUESTIONS = [1, 2, 3, 4, 5] as const;

// The five things somebody says before they buy.
//
// Not the site's general questions repeated — those are on the entry page and
// answer "what is this". These are the reasons a person who already wants one
// does not press the button: a phone with no NFC, a lost card, the monthly
// payment, their phone number being public, and being stuck with the wrong
// three letters. Each one is answered with what actually happens rather than
// with a reassurance.
//
// The answers are emitted as FAQPage data from the same keys the accordion
// renders, because the accordion unmounts a closed answer and a crawler would
// otherwise index four fifths of nothing. Two lists would drift, and Google
// withdraws rich results from a site whose visible and marked-up answers
// disagree — so, one source.
export default async function PersonalFaq() {
  const t = await getTranslations("personal");

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
    <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
        {t("faqTitle")}
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
