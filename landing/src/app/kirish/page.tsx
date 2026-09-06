import { redirect } from "next/navigation";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import SignInForm from "@/components/SignInForm";
import PhoneSignIn from "@/components/PhoneSignIn";
import { getUser } from "@/lib/auth";
import { safePath } from "@/lib/safe-path";

export const metadata: Metadata = {
  title: "Kirish — flex.com.uz",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  havola: "Havola eskirgan yoki allaqachon ishlatilgan. Yangisini so'rang.",
  baza: "Server bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.",
};

export default async function SignInPage(props: PageProps<"/kirish">) {
  const { keyin, xato } = await props.searchParams;

  const next = safePath(keyin);

  // Already signed in — no reason to show the form.
  const user = await getUser();
  if (user) redirect(next);

  const errorKey = typeof xato === "string" ? xato : null;

  return (
    <PageShell>
      <div className="rounded-tile border border-line bg-white p-8 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Hisobingizga kiring</h1>
        <p className="mt-2 mb-7 text-sm text-ink-2">
          Raqam band qilish va profilni tahrirlash uchun avval kiring.
        </p>

        {errorKey && ERRORS[errorKey] && (
          <p className="mb-4 rounded-input bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERRORS[errorKey]}
          </p>
        )}

        {/* The phone first: it is what everybody here has, what every payment
            app signs in with, and the same door the app uses — so one person
            is one account whichever they opened. Email stays underneath for
            the people a number does not reach: foreign buyers, and companies
            whose accounting wants a mailbox. */}
        <PhoneSignIn next={next} />

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs tracking-wide text-ink-3 uppercase">yoki</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <SignInForm next={next} />
      </div>
    </PageShell>
  );
}
