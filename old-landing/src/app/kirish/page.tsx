import { redirect } from "next/navigation";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PhoneSignIn from "@/components/PhoneSignIn";
import { getUser } from "@/lib/auth";
import { safePath } from "@/lib/safe-path";

export const metadata: Metadata = {
  title: "Kirish",
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
      <div className="rounded-tile border border-line bg-white p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Hisobingizga kiring</h1>
        <p className="mt-2 mb-7 text-sm text-ink-2">
          Raqam band qilish va profilni tahrirlash uchun avval kiring.
        </p>

        {errorKey && ERRORS[errorKey] && (
          <p className="mb-4 rounded-input bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERRORS[errorKey]}
          </p>
        )}

        {/* One door, and it is the number. It is what everybody here has,
            what every payment app signs in with, and the same door the app
            uses — so one person is one account whichever they opened.

            Email used to stand underneath it. Two doors are two ways to end up
            with two accounts for one person, and the second one was reaching
            for buyers this product does not have yet. The link itself still
            works — `/kirish/tasdiq` still spends one — so an address that
            already has an account is not locked out; nothing here asks for one
            any more. */}
        <PhoneSignIn next={next} />
      </div>
    </PageShell>
  );
}
