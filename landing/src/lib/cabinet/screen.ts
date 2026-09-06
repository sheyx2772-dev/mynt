import "server-only";

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { ownedHandle, type OwnedHandle } from "./handles";
import { requireAccount } from "./session";

// The door every screen behind a tile goes through.
//
// One function, so a screen that forgets the check has no handle to render.
// Sign-in first, then the number — and the number is a filtered read: one
// this account does not hold comes back null and the screen is a 404, which
// is the page an invented number gets too. Nothing here compares an owner id
// to anything; it never sees one.
export async function openScreen(
  params: Promise<{ locale: string; handle: string }>,
): Promise<OwnedHandle> {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  await requireAccount();

  const owned = await ownedHandle(handle);
  if (!owned) notFound();
  return owned;
}
