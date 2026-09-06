import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// Signed in, holding nothing.
//
// Somebody who paid and is waiting for the hold to clear lands here too, so
// it is not an error screen: it says what to do next and leaves the door to
// orders and sign-out where they always are.
export default async function NoNumbers() {
  const t = await getTranslations("cabinet");

  return (
    <section className="rounded-tile border border-dashed border-border px-6 py-10 text-center">
      <h1 className="text-xl font-semibold tracking-tight">
        {t("empty.title")}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t("empty.body")}
      </p>
      <Button asChild size="lg" className="mt-6">
        <Link href="/personal">{t("empty.cta")}</Link>
      </Button>
    </section>
  );
}
