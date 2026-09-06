import { getTranslations } from "next-intl/server";

import AccountMenu from "./AccountMenu";
import NumberSwitch from "./NumberSwitch";
import Mark from "@/components/Mark";
import { Link } from "@/i18n/navigation";
import { myHandles } from "@/lib/cabinet/handles";

// The bar across the top of every cabinet screen.
//
// Fifty-six pixels: three thumb-sized targets in a row and nothing else. It
// is sticky because the plate in the middle is the answer to "which number am
// I editing", and that question is asked halfway down a long form, not at the
// top of it.
//
// The list of numbers is the same filtered read the pages make (`myHandles`
// is memoised for the request), so the bar never knows a number the page
// would refuse to open. A stranger gets an empty list and, from the page, the
// sign-in form; the bar draws no plate for them and nothing else changes.
export default async function CabinetBar() {
  const t = await getTranslations("cabinet.chrome");
  const handles = await myHandles();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-3 sm:px-5">
        <Link
          href="/cabinet"
          aria-label={t("home")}
          className="flex size-11 items-center justify-center rounded-input transition-colors hover:bg-muted"
        >
          <Mark tone="dark" className="size-8" />
        </Link>

        <NumberSwitch
          handles={handles.map((h) => ({
            raqam: h.raqam,
            reserved: h.holat === "reserved",
          }))}
          label={t("numbers")}
        />

        <AccountMenu
          labels={{
            account: t("account"),
            orders: t("orders"),
            signOut: t("signOut"),
          }}
        />
      </div>
    </header>
  );
}
