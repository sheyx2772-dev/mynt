import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { getPathname } from "@/i18n/navigation";

// Ask whether a number is free.
//
// It is drawn as the address it becomes. The first version had two boxes of
// tracked monospace and a dark button beside them, which is what a one-time
// code screen looks like — and what is being sold here is not a code, it is
// `arend.uz/AAA777`. Somebody was being asked to type before being told what
// they were typing into. So the domain sits in the field, the number continues
// it, and the whole thing is one plate rather than three objects.
//
// One field, not two. Two produced `?harflar=sdf&raqamlar=423`, which is one
// number wearing three addresses once case is counted — the exact thing the
// locale routing refuses to do. One name, uppercased where it lands.
//
// Still a form, still a GET, still nothing in the browser: the markup arrives
// complete and the answer has an address that can be shared.
//
// The cost of one field is the numeric keypad on a phone: a text input opens
// letters, so the digits take one "?123" tap. That is what the number being
// one thing costs, and it is worth it.
export default async function HandleForm() {
  const t = await getTranslations("hero");
  const locale = await getLocale();

  // Written out rather than left to a redirect. `action="/personal"` posts to a
  // path with no locale on it, so every submit took a detour through the proxy
  // before it reached the page.
  const action = getPathname({ href: "/personal", locale });

  const button =
    "flex h-12 shrink-0 items-center justify-center gap-2 bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-s2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <form action={action} className="mt-4">
      <div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
        {/* One plate. `focus-within` moves the whole thing, so the address and
            the number light up together — they are one object. */}
        <div className="flex h-14 flex-1 items-center rounded-input border border-line-2 bg-white pl-4 transition-colors focus-within:border-line-lead focus-within:ring-2 focus-within:ring-ring">
          <span
            aria-hidden="true"
            className="shrink-0 text-[15px] text-ink-3 select-none"
          >
            arend.uz/
          </span>

          <label htmlFor="raqam" className="sr-only">
            {t("numberLabel")}
          </label>
          <input
            id="raqam"
            name="number"
            required
            maxLength={6}
            pattern="[A-Za-z]{3}[0-9]{3}"
            // The browser's own message for a failed pattern arrives in the
            // browser's language and explains nothing. This is what it says.
            title={t("numberTitle")}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            // The engraving's tracking, so the number on screen and the number
            // on the card are one object at two sizes.
            className="w-full min-w-0 bg-transparent px-1 font-mono text-xl font-semibold tracking-[0.22em] text-ink uppercase focus:outline-none"
          />

          {/* Docked inside the plate rather than standing beside it: one
              object, and no second elevation on a row that already has one. */}
          <button type="submit" className={`${button} m-1 hidden rounded-plate px-5 sm:flex`}>
            {t("check")}
            <ArrowRight className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* On a phone the plate takes the width and the button gets its own
            row. The alternative was flex-wrap deciding it, which hung the
            button under a gap nobody drew. */}
        <button type="submit" className={`${button} rounded-input px-5 sm:hidden`}>
          {t("check")}
          <ArrowRight className="size-4" strokeWidth={2} />
        </button>
      </div>

      <p className="mt-3 text-[13px] text-ink-3">{t("hint")}</p>
    </form>
  );
}
