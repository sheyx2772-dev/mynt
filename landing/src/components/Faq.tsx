import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";

// The five questions, in `<details>`.
//
// Native rather than a component with state: it opens without JavaScript, the
// browser finds text inside a closed one when somebody uses ctrl-F, and a
// search engine reads all five whether they are open or not. A scripted
// accordion gives up all three to animate a chevron.
export default async function Faq() {
  const t = await getTranslations("faq");
  const questions = [1, 2, 3, 4, 5] as const;

  return (
    <section id="savollar" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16 sm:py-20">
      <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
        {t("title")}
      </h2>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {questions.map((n) => (
          <details key={n} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              {t(`q${n}`)}
              <ChevronDown
                className="size-5 shrink-0 text-ink-3 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                strokeWidth={1.75}
              />
            </summary>
            <p className="mt-3 leading-relaxed text-ink-2">{t(`a${n}`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
