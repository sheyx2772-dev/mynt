import type { Lang } from "@/lib/i18n";

// Three letters, and a form rather than links.
//
// A link with ?til= changes this page; the cookie behind this form changes
// every page after it. Somebody who switches to Russian on the price list and
// then opens the devices page should not be back in Uzbek — and without the
// cookie they would be.
//
// It is a form and not a script, so it works before hydration and on a phone
// with a bad connection, which is where a card gets opened.
export default function LangSwitch({
  lang,
  next,
  tone = "light",
}: {
  lang: Lang;
  /** Where to come back to, which is the page this was rendered on. */
  next: string;
  tone?: "light" | "dark";
}) {
  const on =
    tone === "dark"
      ? "rounded-md bg-white/15 px-2 py-1 font-medium text-white"
      : "rounded-md bg-flex-black px-2 py-1 font-medium text-white";
  const off =
    tone === "dark"
      ? "rounded-md px-2 py-1 text-white/40 transition-colors hover:text-white/80"
      : "rounded-md px-2 py-1 text-flex-black/40 transition-colors hover:text-flex-black/70";

  return (
    <form
      action="/api/til"
      method="post"
      className="flex items-center gap-0.5 text-[11px] tracking-[0.14em] uppercase"
    >
      <input type="hidden" name="keyin" value={next} />
      {(["uz", "ru", "en"] as const).map((option) => (
        <button
          key={option}
          name="til"
          value={option}
          lang={option}
          aria-current={option === lang ? "true" : undefined}
          className={option === lang ? on : off}
        >
          {option}
        </button>
      ))}
    </form>
  );
}
