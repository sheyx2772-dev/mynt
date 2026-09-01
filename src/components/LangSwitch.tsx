import Link from "next/link";
import type { Lang } from "@/lib/i18n";

// Two letters, because the language is usually already right.
//
// The visitor's browser has normally answered this, so the switch exists for
// the case where it did not — a Russian speaker on a phone set to Uzbek. It
// keeps whatever else is in the address, so switching on the posts tab does not
// throw you back to the card, and the switched link is shareable: somebody
// forwarding a profile to a Russian-speaking colleague can forward it switched.
export default function LangSwitch({
  lang,
  handle,
  params,
}: {
  lang: Lang;
  handle: string;
  params: Record<string, string | undefined>;
}) {
  function href(to: Lang): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    query.set("til", to);
    return `/${handle}?${query}`;
  }

  return (
    <div className="flex items-center gap-1 text-[11px] tracking-[0.14em] uppercase">
      {(["uz", "ru"] as const).map((option) => (
        <Link
          key={option}
          href={href(option)}
          hrefLang={option}
          className={
            option === lang
              ? "rounded-md bg-flex-black px-2 py-1 font-medium text-white"
              : "rounded-md px-2 py-1 text-flex-black/40 transition-colors hover:text-flex-black/70"
          }
        >
          {option}
        </Link>
      ))}
    </div>
  );
}
