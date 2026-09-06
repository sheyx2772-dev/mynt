import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import NoNumbers from "@/components/cabinet/NoNumbers";
import NumberHome from "@/components/cabinet/NumberHome";
import { redirect } from "@/i18n/navigation";
import { myHandles, normalize } from "@/lib/cabinet/handles";
import { requireAccount } from "@/lib/cabinet/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cabinet">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cabinet" });
  return { title: t("title") };
}

// The screen behind "Kabinet".
//
// Not a list of numbers. Almost everybody holds exactly one, and for them a
// list is a whole screen that exists to hold a single row — so this opens
// straight onto that number's home, and the others (if any) are behind the
// plate in the bar (`NumberSwitch`). Each is its own address,
// `/cabinet/VIP777`, rather than a query on this one: a person shares and
// bookmarks a number, not a filter.
//
// Which number opens: `?number=` when the sign-in page passed one through and
// it is actually held by this account — an unowned number in the query is
// simply ignored, not reported — otherwise the oldest claim, because that is
// the one printed on cards.
export default async function CabinetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/cabinet">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAccount();

  const handles = await myHandles();
  if (handles.length === 0) return <NoNumbers />;

  const { number } = await searchParams;
  const asked = typeof number === "string" ? normalize(number) : null;
  const chosen = handles.find((h) => h.raqam === asked);

  // Sent to the number's own address rather than rendered here under `?number=`:
  // the switcher links to `/cabinet/AAA111`, and two addresses for one screen
  // is the thing the whole site refuses to do.
  if (chosen && handles.length > 1) {
    redirect({ href: `/cabinet/${chosen.raqam}`, locale });
  }

  const open = chosen ?? handles[0];

  return <NumberHome handle={open} />;
}
