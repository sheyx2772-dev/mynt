import { redirect } from "next/navigation";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import SignInForm from "@/components/SignInForm";
import TelegramSignIn from "@/components/TelegramSignIn";
import { isTelegramLoginConfigured, startTelegramLogin } from "@/lib/auth/telegram-login";
import { getUser } from "@/lib/auth";
import { safePath } from "@/lib/safe-path";

export const metadata: Metadata = {
  title: "Kirish — flex.com.uz",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  havola: "Havola eskirgan yoki allaqachon ishlatilgan. Yangisini so'rang.",
  baza: "Baza bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.",
};

export default async function SignInPage(props: PageProps<"/kirish">) {
  const { keyin, xato } = await props.searchParams;

  const next = safePath(keyin);

  // Already signed in — no reason to show the form.
  const user = await getUser();
  if (user) redirect(next);

  const errorKey = typeof xato === "string" ? xato : null;

  // Minted here rather than on the click, so the button can be a plain link
  // and never meets a popup blocker. A reload reuses the outstanding one.
  const telegram = isTelegramLoginConfigured ? await startTelegramLogin() : null;

  return (
    <PageShell>
      <div className="rounded-[1.75rem] border border-black/10 bg-white p-8 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Hisobingizga kiring</h1>
        <p className="mt-2 mb-7 text-sm text-flex-black/60">
          Handle band qilish va profilingizni tahrirlash uchun kirish talab qilinadi.
        </p>

        {errorKey && ERRORS[errorKey] && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERRORS[errorKey]}
          </p>
        )}

        {/* Telegram first: it is one tap, it costs nothing, and it is what
            this market actually has on its phone. Email stays underneath for
            the people Telegram does not reach — foreign buyers, and companies
            whose accounting wants a mailbox. */}
        {telegram?.ok && (
          <>
            <TelegramSignIn
              next={next}
              code={telegram.code}
              deepLink={telegram.deepLink}
            />

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-black/10" />
              <span className="text-xs tracking-wide text-flex-black/35 uppercase">
                yoki
              </span>
              <span className="h-px flex-1 bg-black/10" />
            </div>
          </>
        )}

        <SignInForm next={next} />
      </div>
    </PageShell>
  );
}
