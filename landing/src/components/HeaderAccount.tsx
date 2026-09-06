import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { myHandles } from "@/lib/cabinet/handles";
import { currentAccount } from "@/lib/cabinet/session";

/**
 * The right-hand end of the header: a way in, or the way back to your own.
 *
 * Split out of `SiteHeader` because this is the one part of the chrome that
 * depends on who is asking. Reading the session cookie makes a render dynamic,
 * and the header sits in the layout — so left inline it would make every
 * marketing page dynamic, including the ones whose whole job is to be
 * prerendered and arrive fast. Here it is its own component behind a
 * `Suspense` boundary: the page streams with the signed-out shape already
 * drawn, and this replaces it when the answer comes back.
 *
 * The signed-out state is therefore also the fallback, which is why it renders
 * identically in both files. A reader who is signed in sees "Kirish" for the
 * length of one request rather than an empty space that jumps.
 */
export default async function HeaderAccount() {
  const t = await getTranslations("nav");
  const account = await currentAccount();

  if (!account) return <SignIn label={t("signIn")} />;

  // Somebody can hold several. The header shows the one they have held
  // longest, which is the one the backend returns first and the one a person
  // means when they say "my number".
  const [handle] = await myHandles();
  if (!handle) return <SignIn label={t("signIn")} />;

  return (
    <Link
      href="/cabinet"
      className="flex h-10 items-center gap-2.5 rounded-input pr-1 pl-1 transition-colors hover:bg-ink-s1"
    >
      <span className="flex size-8 items-center justify-center rounded-full border border-ink-line bg-gold text-xs font-semibold text-ink">
        {handle.raqam.slice(0, 2)}
      </span>
      <span className="hidden font-mono text-xs font-semibold tracking-[0.14em] text-paper-2 sm:inline">
        {handle.raqam}
      </span>
    </Link>
  );
}

export function SignIn({ label }: { label: string }) {
  return (
    <Link
      href="/login"
      className="hidden h-10 items-center px-3.5 text-sm font-medium text-paper-2 transition-colors hover:text-white sm:flex"
    >
      {label}
    </Link>
  );
}
