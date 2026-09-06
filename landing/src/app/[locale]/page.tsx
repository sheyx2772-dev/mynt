import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";

// A placeholder, and a proof.
//
// It exists to show the three pieces working together before anything real is
// moved across: the language comes from the address, the words come from
// `messages/`, and the page is rendered on the server — `getTranslations` is
// awaited, so no dictionary is shipped to the browser to render it.
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
      <div>
        <Button size="lg">{t("cta")}</Button>
      </div>
    </main>
  );
}
