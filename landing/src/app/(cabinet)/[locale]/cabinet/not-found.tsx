import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// A number this account does not hold, or a screen that does not exist.
//
// One page for both on purpose. `openScreen` answers `notFound()` for a number
// somebody else owns and for a number nobody owns, so this is the page a
// guesser walking the address space sees every time — and it says nothing
// about which of the two they hit. Without this file the group falls back to
// Next's own English 404, which is the one page of the cabinet that would
// not be in the owner's language.
export default async function CabinetNotFound() {
  const t = await getTranslations("cabinet.notFound");

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <p className="cap text-muted-foreground">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t("body")}
      </p>
      <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
        <Link href="/cabinet">{t("back")}</Link>
      </Button>
    </div>
  );
}
