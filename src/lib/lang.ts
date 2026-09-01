import "server-only";

import { cookies, headers } from "next/headers";
import { pickLang, isLang, type Lang } from "@/lib/i18n";

// Which language a page renders in, site-wide.
//
// Prefixed routes — /ru/qurilmalar — would be the usual answer and are not
// available here: handles own the root path, so `[til]` and `[handle]` would be
// two differently-named dynamic segments at the same level, which Next refuses.
// The number namespace is the product, so it keeps the root and the language
// moves into a query and a cookie.
//
// Order: an explicit choice in the address, then what was chosen last time,
// then what the browser asks for. The cookie exists so a switch survives the
// next click — without it a person choosing Russian on the landing page is back
// in Uzbek the moment they open the price list.

export const LANG_COOKIE = "til";

export async function getLang(param?: unknown): Promise<Lang> {
  if (isLang(param)) return param;

  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(chosen)) return chosen;

  return pickLang(undefined, (await headers()).get("accept-language"));
}
