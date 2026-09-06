"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";

import Toast from "@/components/Toast";
import {
  confirmSignInCode,
  sendSignInCode,
  type CodeResult,
  type ConfirmResult,
} from "@/app/kirish/actions";

const askState: CodeResult = { sent: false, error: "" };
const confirmState: ConfirmResult = { ok: false, error: "" };

// The website's main door, and the same one the app uses.
//
// A number rather than an address because this is what everybody here has and
// remembers, and because the card being sold is handed to people who will
// never be asked for an email.
export default function PhoneSignIn({ next }: { next: string }) {
  const [ask, askAction, asking] = useActionState(sendSignInCode, askState);

  if (!ask.sent) return <AskForNumber action={askAction} busy={asking} error={ask.error} />;

  return <AskForCode next={next} phone={ask.phone} testCode={ask.kod} />;
}

function AskForNumber({
  action,
  busy,
  error,
}: {
  action: (formData: FormData) => void;
  busy: boolean;
  error: string;
}) {
  // Grouped as it is typed, the way it is written on every shopfront here.
  // `+998 90 123 45 67` can be checked at a glance; thirteen digits in a row
  // have to be read one at a time.
  const [phone, setPhone] = useState("+998 ");

  return (
    <form action={action} className="space-y-3 text-left">
      <input type="hidden" name="telefon" value={phone} />
      <input
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(group(e.target.value))}
        placeholder="+998 90 123 45 67"
        className="w-full rounded-input border border-line bg-black/[0.02] px-4 py-3 text-sm outline-none transition-colors focus:border-line-lead focus:bg-white"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-input bg-flex-black py-3 text-sm font-medium text-white transition-colors hover:bg-flex-black/85 disabled:opacity-50"
      >
        {busy ? "Yuborilmoqda…" : "Kod yuborish"}
      </button>
    </form>
  );
}

function AskForCode({
  next,
  phone,
  testCode,
}: {
  next: string;
  phone: string;
  testCode?: string;
}) {
  const router = useRouter();
  const [state, action, busy] = useActionState(confirmSignInCode, confirmState);

  // The server action cannot navigate on its own, because it has to set the
  // cookie on the same response.
  if (state.ok) router.replace(state.next);

  return (
    <form action={action} className="space-y-3 text-left">
      <input type="hidden" name="telefon" value={phone} />
      <input type="hidden" name="keyin" value={next} />

      <p className="text-sm text-ink-2">
        <span className="font-medium text-flex-black">{group(`+${phone}`)}</span> raqamiga kod
        yuborildi.
      </p>

      {/* Over the page rather than in the form. The code is not part of
          signing in — it is what the SMS would have said, and putting it in
          the form makes a temporary crutch look like a field somebody is
          meant to fill. It goes when Eskiz is connected: the backend stops
          returning `kod` and this stops rendering, with nothing to remember
          to remove. */}
      {testCode && (
        <Toast>
          <span className="flex items-start gap-2">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Sinov rejimi — SMS yuborilmadi.
              <br />
              Kod: <b className="font-semibold tracking-[0.2em]">{testCode}</b>
            </span>
          </span>
        </Toast>
      )}

      <input
        name="kod"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        defaultValue={testCode ?? ""}
        placeholder="000000"
        className="w-full rounded-input border border-line bg-black/[0.02] px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] outline-none transition-colors focus:border-line-lead focus:bg-white"
      />

      {!state.ok && state.error && <p className="text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-input bg-flex-black py-3 text-sm font-medium text-white transition-colors hover:bg-flex-black/85 disabled:opacity-50"
      >
        {busy ? "Tekshirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}

/** `998901234567` reads as `+998 90 123 45 67`. */
function group(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 15);
  if (!digits.startsWith("998")) return `+${digits}`;

  const rest = digits.slice(3);
  const parts = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5, 7), rest.slice(7, 9)];
  return `+998 ${parts.filter(Boolean).join(" ")}`.trimEnd();
}
