import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { parseHandle } from "@/lib/pricing";
import SignInForm from "./SignInForm";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Nothing here is worth finding in a search result, and an indexed sign-in
    // page is a page that collects people who were looking for the product and
    // gives them a form instead of it.
    robots: { index: false },
  };
}

/**
 * The way in.
 *
 * One field, then one code. The number a person is holding is the account, so
 * this page is also where an account is opened — there is no second form for
 * that, and there is nothing on the page that behaves differently for a number
 * we have seen before. See `actions.ts` for why that is a decision rather than
 * a simplification.
 *
 * Nobody is sent away for being signed in already. The cookie is not proof —
 * it can be expired or revoked, and turning somebody with a stale one away
 * from the sign-in page locks them out of the product — and the only thing
 * that knows is the backend, which would be a round trip in front of everybody
 * who is not signed in, which is everybody this page is for. Signing in twice
 * costs a new session and lands in the same place.
 */
export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("login");

  // The order step sends the number somebody just picked. It is shown back to
  // them here — a person who chose NAV001 and lands on a bare sign-in form has
  // to guess whether the choice survived — and it is rebuilt from the three
  // letters and three digits it parsed into rather than printed as it arrived,
  // because this is a query parameter rendered onto a page.
  const chosen = parseHandle(String(query.number ?? ""));
  const handle = chosen ? `${chosen.letters}${chosen.digits}` : null;

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-md px-6 py-14 sm:py-20">
        <h1 className="text-[30px] leading-9 font-semibold tracking-tight sm:text-[34px] sm:leading-10">
          {t("title")}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-2">{t("lead")}</p>

        {handle && (
          <div className="mt-7 flex items-center justify-between gap-4 rounded-input border border-line bg-white px-4 py-3">
            <span className="cap text-ink-3">{t("chosenLabel")}</span>
            <span className="font-mono text-lg font-semibold tracking-[0.14em] text-ink">
              {handle}
            </span>
          </div>
        )}

        <div className="mt-6 rounded-tile border border-line bg-white p-5 sm:p-7">
          <SignInForm language={locale} handle={handle} />
        </div>

        <p className="mt-5 text-[13px] leading-5 text-ink-3">
          {t("newAccountNote")}
        </p>
      </div>
    </main>
  );
}
