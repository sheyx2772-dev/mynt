import { redirect } from "next/navigation";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import SignInForm from "@/components/SignInForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Kirish — mynt.uz",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  havola: "Havola eskirgan yoki allaqachon ishlatilgan. Yangisini so'rang.",
  baza: "Baza bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.",
};

export default async function SignInPage(props: PageProps<"/kirish">) {
  const { keyin, xato } = await props.searchParams;

  const rawNext = typeof keyin === "string" ? keyin : "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Already signed in — no reason to show the form.
  const user = await getUser();
  if (user) redirect(next);

  const errorKey = typeof xato === "string" ? xato : null;

  return (
    <PageShell>
      <div className="rounded-[1.75rem] border border-black/10 bg-white p-8 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Hisobingizga kiring</h1>
        <p className="mt-2 mb-7 text-sm text-mynt-black/60">
          Handle band qilish va profilingizni tahrirlash uchun kirish talab qilinadi.
        </p>

        {errorKey && ERRORS[errorKey] && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERRORS[errorKey]}
          </p>
        )}

        <SignInForm next={next} />
      </div>
    </PageShell>
  );
}
