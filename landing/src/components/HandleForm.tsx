import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

// Ask whether a number is free.
//
// A plain form, rendered on the server, that navigates. The site it replaces
// did this in the browser: a client component held the two fields, validated
// them and pushed a route. That is JavaScript spent on something the platform
// does — and it is the first thing on the page, so it is JavaScript the
// visitor waits for before they can type.
//
// Now the markup arrives complete. `pattern` gives the browser its own
// validation, `enterKeyHint` puts "go" on a phone keyboard, and the submit is
// a GET to the page that answers the question — which means the answer has an
// address, so it can be linked, shared and opened in a second tab.
export default async function HandleForm() {
  const t = await getTranslations("hero");

  const field =
    "h-14 w-full rounded-input border border-line-2 bg-white px-4 text-center font-mono text-lg font-semibold tracking-[0.3em] text-ink uppercase placeholder:tracking-[0.3em] placeholder:text-line-lead focus-visible:border-line-lead focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <form action="/shaxsiy" className="mt-4 max-w-xl">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 basis-32">
          <span className="cap mb-1.5 block text-ink-3">{t("letters")}</span>
          <input
            name="harflar"
            required
            maxLength={3}
            pattern="[A-Za-z]{3}"
            placeholder="AAA"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={field}
          />
        </label>

        <label className="flex-1 basis-32">
          <span className="cap mb-1.5 block text-ink-3">{t("digits")}</span>
          <input
            name="raqamlar"
            required
            maxLength={3}
            pattern="[0-9]{3}"
            inputMode="numeric"
            placeholder="777"
            autoComplete="off"
            enterKeyHint="go"
            className={field}
          />
        </label>

        <button
          type="submit"
          className="flex h-14 items-center gap-2 rounded-input bg-ink px-6 text-sm font-semibold text-white shadow-slab transition-colors hover:bg-ink-s2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {t("check")}
          <ArrowRight className="size-4" strokeWidth={2} />
        </button>
      </div>

      <p className="mt-3 text-sm text-ink-3">{t("cardHint")}</p>
    </form>
  );
}
