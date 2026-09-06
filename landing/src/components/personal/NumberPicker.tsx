import { Suspense } from "react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import HandleField from "@/components/HandleField";
import HandleResult from "@/components/HandleResult";
import { getPathname } from "@/i18n/navigation";
import { BASE_PRICE } from "@/lib/pricing";

// The check, asked and answered on this page.
//
// `HandleForm` does the same thing on the entry page and is not reused here
// for one reason: it posts to `/`, so pressing the button on this page would
// throw the reader back to the front of the site with their answer. The field
// and the answer are the shared parts and they are shared; only the address
// the form submits to is different, and that is the whole of this file.
//
// The field's own labels are read from the `hero` namespace rather than
// copied into `personal`. It is the same field asking the same question, and
// two copies of "3 letters and 3 digits" drift the day one of them is edited.
export default async function NumberPicker({ asked }: { asked?: string }) {
  const t = await getTranslations("personal");
  const field = await getTranslations("hero");
  const locale = await getLocale();
  const format = await getFormatter();

  const rules = [1, 2, 3] as const;

  return (
    <section id="number" className="scroll-mt-20 border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("pickEyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("pickTitle")}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
          {t("pickLead")}
        </p>

        {/* Written out rather than left to a redirect: a path with no locale
            on it takes a detour through the proxy before it reaches the page,
            and this form is submitted by somebody standing on the page. */}
        <form
          action={getPathname({ href: "/personal", locale })}
          className="mt-8"
        >
          {/* The section owns `#number` — it is what every button on the
              page scrolls to — so the input takes a different id. Two
              elements answering to one anchor is a link that lands on
              whichever the browser met first. */}
          <label htmlFor="handle" className="sr-only">
            {field("numberLabel")}
          </label>

          <HandleField
            id="handle"
            name="number"
            asked={asked}
            title={field("numberTitle")}
            placeholder="ABC123"
            checkLabel={field("check")}
          >
            {asked ? (
              // Suspended here so the wait costs this card and not the page:
              // without it the lookup suspends the route, `loading.tsx` takes
              // the screen, and somebody who pressed a button watches the
              // page they were reading disappear.
              <Suspense fallback={<Pending />}>
                <HandleResult asked={asked} />
              </Suspense>
            ) : (
              <p className="mt-3 text-[13px] text-ink-3">{field("hint")}</p>
            )}
          </HandleField>
        </form>

        <div className="mt-10 max-w-xl rounded-card border border-line bg-paper p-5">
          <p className="cap text-ink-3">{t("formulaTitle")}</p>
          <p className="mt-2 font-mono text-[15px] tracking-[0.02em] text-ink">
            {t("formula", { base: format.number(BASE_PRICE) })}
          </p>
          <ul className="mt-4 space-y-1.5 text-[15px] leading-relaxed text-ink-2">
            {rules.map((n) => (
              <li key={n}>{t(`rule${n}`)}</li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
            {t("blockedNote")}
          </p>
        </div>
      </div>
    </section>
  );
}

// The shape of the answer, holding its own space. Not a spinner: the card that
// arrives is this tall, so nothing below it moves when the real one lands.
function Pending() {
  return (
    <div
      className="mt-4 h-[86px] max-w-xl animate-pulse rounded-card border border-line bg-white motion-reduce:animate-none"
      aria-hidden="true"
    />
  );
}
