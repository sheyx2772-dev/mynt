import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import HandleField from "@/components/HandleField";
import HandleResult from "@/components/HandleResult";
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
export default async function HandleForm({ asked }: { asked?: string }) {
  const t = await getTranslations("hero");
  const locale = await getLocale();

  // Back to this page, not away from it. Somebody asking "is AAA777 free"
  // should not be moved somewhere to find out — and because it is a GET, the
  // answer has an address they can send to somebody.
  //
  // Written out rather than left to a redirect: a path with no locale on it
  // takes a detour through the proxy before it reaches the page.
  const action = getPathname({ href: "/", locale });

  const button =
    "flex h-12 shrink-0 items-center justify-center gap-2 bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-s2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <form action={action} className="mt-4">
      <div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
        {/* One plate. `focus-within` moves the whole thing, so the address and
            the number light up together — they are one object. */}
        <div className="relative flex h-14 flex-1 items-center rounded-input border border-line-2 bg-white pl-4 transition-colors focus-within:border-ink focus-within:ring-2 focus-within:ring-ring">
          <span
            aria-hidden="true"
            className="shrink-0 text-[15px] text-ink-3 select-none"
          >
            arend.uz/
          </span>

          <label htmlFor="raqam" className="sr-only">
            {t("numberLabel")}
          </label>
          <HandleField
            id="raqam"
            name="number"
            defaultValue={asked ?? ""}
            title={t("numberTitle")}
            placeholder="ABC123"
            className="w-full min-w-0 bg-transparent px-1 font-mono text-xl font-semibold tracking-[0.22em] text-ink uppercase placeholder:font-normal placeholder:text-line-lead focus:outline-none"
          />

          {/* Docked inside the plate rather than standing beside it: one
              object, and no second elevation on a row that already has one.
              
              3px, not 4. The plate is 56 tall with a 1px border, so its inside
              is 54; a 48px button leaves 3 above and below, and 4 would have
              stood it 1px proud of its own container at every corner. The
              radius follows from the same sum — 12 outside, less the border,
              less the inset, is 8 — which is why the two corners look
              concentric instead of nested. */}
          <button type="submit" className={`${button} m-[3px] hidden rounded-plate px-5 sm:flex`}>
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

      {/* The hint holds the space the live price appears in, so nothing below
          moves when it does. Once a number has been asked about, the answer
          replaces it. */}
      {asked ? (
        <HandleResult asked={asked} />
      ) : (
        <p className="mt-3 text-[13px] text-ink-3">{t("hint")}</p>
      )}
    </form>
  );
}
