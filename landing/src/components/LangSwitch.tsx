"use client";

import { useLocale } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Three languages behind one control.
//
// Laid out as three chips it took a third of the header's right side to say
// something a reader changes once and then never again — space the sections
// and the call to action have better uses for.
//
// The items are real links to this same page in the other language, so they
// can be middle-clicked and copied. Hiding them behind a menu costs nothing
// with a crawler: what a search engine reads is the `hreflang` set in the
// document head, not a visible list.
//
// `usePathname` returns the path with the locale segment stripped, which is
// what `Link` wants — it puts the chosen one back on.

const NAMES: Record<string, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

export default function LangSwitch({
  tone = "dark",
}: {
  tone?: "light" | "dark";
}) {
  const active = useLocale();
  const pathname = usePathname();

  const dark = tone === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex h-9 items-center gap-1.5 rounded-input px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          dark
            ? "text-paper-2 hover:bg-ink-s1 hover:text-white"
            : "text-ink-2 hover:bg-fill hover:text-ink"
        }`}
      >
        <Globe className="size-4" strokeWidth={1.75} />
        <span className="uppercase">{active}</span>
        <ChevronDown className="size-3.5 opacity-60" strokeWidth={2} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[168px]">
        {routing.locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link
              href={pathname}
              locale={locale}
              lang={locale}
              // Read by a screen reader as the current choice, not inferred
              // from the tick — which is decoration.
              aria-current={locale === active ? "true" : undefined}
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span>{NAMES[locale]}</span>
              {locale === active && (
                <Check className="size-4 text-lime-ink" strokeWidth={2.25} />
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
