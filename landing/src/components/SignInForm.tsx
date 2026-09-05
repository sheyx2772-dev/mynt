"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { sendSignInLink, type SignInResult } from "@/app/kirish/actions";

const initialState: SignInResult = { sent: false, error: "" };

export default function SignInForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(sendSignInLink, initialState);

  if (state.sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime/20">
          <MailCheck className="h-6 w-6 text-flex-black" />
        </div>
        <h2 className="mt-5 font-display text-xl font-semibold">Xat yuborildi</h2>
        <p className="mt-2 text-sm text-flex-black/60">
          <span className="font-medium text-flex-black">{state.email}</span> manziliga kirish
          havolasi yubordik. Xatni oching va havolani bosing.
        </p>
        <p className="mt-4 text-xs text-flex-black/40">
          Xat kelmadimi? &quot;Spam&quot; papkasini tekshiring.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 text-left">
      <input type="hidden" name="keyin" value={next} />
      <input
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="siz@email.com"
        className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm outline-none transition-colors focus:border-flex-black/30 focus:bg-white"
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-lime px-6 py-3 font-medium text-flex-black transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {isPending ? "Yuborilmoqda..." : "Kirish havolasini yuborish"}
      </button>
      <p className="text-center text-xs text-flex-black/40">
        Parol kerak emas — emailingizga bir martalik havola yuboramiz.
      </p>
    </form>
  );
}
