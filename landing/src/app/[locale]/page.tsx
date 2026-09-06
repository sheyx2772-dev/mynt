import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";

// A placeholder, and a proof.
//
// It exists to show the pieces working together before anything real is moved
// across: the language comes from the address, the words come from `messages/`,
// the page is rendered on the server, and the colours come from the brand
// rather than from shadcn's neutral defaults.
//
// Nothing here is the design. The header and footer land next, and then pages
// start arriving from `old-landing/`.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-balance">
        {t("title")}
      </h1>
      <p className="text-muted-foreground text-lg text-pretty">{t("lead")}</p>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg">{t("cta")}</Button>
        {/* The number, in the face the number is set in. The one place a
            second font earns its download. */}
        <span className="rounded-plate border border-line px-3 py-2 font-mono text-sm font-semibold tracking-[0.18em]">
          AAA777
        </span>
      </div>

      {/* The ladder, visible while there is nothing else to look at. It goes
          when the real pages arrive. */}
      <div className="mt-8 flex flex-wrap gap-2 text-xs">
        {[
          ["bg-lime", "lime"],
          ["bg-ink", "ink"],
          ["bg-paper border border-line", "paper"],
          ["bg-fill", "fill"],
          ["bg-gold", "gold"],
        ].map(([className, name]) => (
          <span key={name} className="flex items-center gap-2">
            <span className={`size-5 rounded-plate ${className}`} />
            <span className="text-muted-foreground">{name}</span>
          </span>
        ))}
      </div>
    </main>
  );
}
