import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import NumberHome from "@/components/cabinet/NumberHome";
import { myHandles, normalize } from "@/lib/cabinet/handles";
import { requireAccount } from "@/lib/cabinet/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cabinet/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return { title: normalize(handle) ?? "" };
}

// One number's home, at its own address.
//
// The same screen `/cabinet` opens, for a number chosen from the bar. The
// list is read once and the number is found in it rather than fetched on its
// own: the bar's switcher needs the list anyway (it is memoised for the
// request), and a number that is not in this account's list is `notFound()`
// — the same page an invented number gets.
export default async function HandlePage({
  params,
}: PageProps<"/[locale]/cabinet/[handle]">) {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  await requireAccount();

  const raqam = normalize(handle);
  if (!raqam) notFound();

  const handles = await myHandles();
  const open = handles.find((h) => h.raqam === raqam);
  if (!open) notFound();

  return <NumberHome handle={open} />;
}
