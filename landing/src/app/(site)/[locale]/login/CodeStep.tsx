"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { formatPhone } from "@/lib/phone";
import { confirmCode, type AskState, type ConfirmState } from "./actions";
import useCountdown from "./useCountdown";

const START: ConfirmState = {};

/** How long before a second SMS may be asked for. */
const RESEND_SECONDS = 60;

/**
 * The code, and the two ways out of this step.
 *
 * Nothing here renders the code itself, and nothing may: a development backend
 * answers the first step with the code in the body so the product can be used
 * before an SMS provider exists, and the site this replaces put it in a toast.
 * A code on a screen is a code that anybody standing behind the reader has, and
 * a crutch that is visible becomes a habit. It is not passed to the browser at
 * all — see `requestCode`.
 */
export default function CodeStep({
  language,
  handle,
  phone,
  sentAt,
  resend,
  resending,
  resendError,
  onEdit,
  prefill,
}: {
  language: string;
  handle: string | null;
  phone: string;
  sentAt: number;
  resend: (form: FormData) => void;
  resending: boolean;
  resendError: AskState["error"];
  onEdit: () => void;
  /**
   * TEMPORARY. The code, already filled in.
   *
   * Only ever set outside a production build, and only when the backend has no
   * SMS provider — `devCode` in `actions.ts` carries the full reasoning and the
   * condition for deleting both halves. It is `key`ed on the send time so a
   * resent code replaces the one in the box rather than leaving the old one
   * sitting there looking valid.
   */
  prefill?: string;
}) {
  const t = useTranslations("login");
  const [state, action, checking] = useActionState<ConfirmState, FormData>(
    confirmCode,
    START,
  );
  const [code, setCode] = useState(prefill ?? "");
  const left = useCountdown(sentAt, RESEND_SECONDS);

  // A resent code replaces the one in the boxes rather than leaving the old
  // one sitting there looking valid.
  const [shownFor, setShownFor] = useState(sentAt);
  if (shownFor !== sentAt) {
    setShownFor(sentAt);
    setCode(prefill ?? "");
  }

  // The code first, because it is what the reader is doing; a failed resend
  // underneath it is the smaller of the two things to say.
  const problem = state.error
    ? state.error === "server"
      ? "errorServer"
      : "errorCode"
    : resendError === "send"
      ? "errorSend"
      : resendError
        ? "errorPhone"
        : null;

  return (
    <>
      <form action={action}>
        {/* Half of a pair the backend checks against a code it hashed itself,
            not a claim about who is signing in. Identity is what the backend
            answers with; see `confirmCode`. */}
        <input type="hidden" name="phone" value={phone} />
        {/* Where to go afterwards, and in which language. Both are matched
            against our own lists on the server rather than pasted into a path,
            so neither can send anybody off this site. */}
        <input type="hidden" name="language" value={language} />
        {handle && <input type="hidden" name="number" value={handle} />}

        <p className="text-[15px] leading-6 text-ink-2">
          {t.rich("codeSent", {
            number: formatPhone(phone),
            phone: (chunks) => (
              <span className="font-mono font-semibold text-ink">{chunks}</span>
            ),
          })}
        </p>

        <label htmlFor="code" className="cap mt-6 mb-1.5 block text-ink-3">
          {t("codeLabel")}
        </label>

        {/* Six boxes rather than one field, and digits rather than
            characters. A plain input took letters happily — `pattern` is only
            consulted when the form is submitted, so `kljojo` sat in the box
            looking like an answer until the button was pressed. This refuses
            the keystroke, the way the number field on the entry page does.

            It is also six boxes because the thing being typed is six digits
            read off a notification: the boxes count them, so nobody has to. */}
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          name="code"
          autoFocus
          containerClassName="mt-1.5"
        >
          <InputOTPGroup className="w-full gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-14 flex-1 rounded-input border border-line-2 bg-white font-mono text-xl font-semibold text-ink data-[active=true]:border-ink data-[active=true]:ring-2 data-[active=true]:ring-ring"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <p className="mt-2 text-[13px] leading-5 text-ink-3">{t("codeHint")}</p>

        {problem && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {t(problem)}
          </p>
        )}

        <button
          type="submit"
          disabled={checking || code.length !== 6}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-input bg-lime text-sm font-semibold text-ink transition-colors hover:bg-lime-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
        >
          {checking ? t("checking") : t("submit")}
        </button>
      </form>

      {/* Both are text, and both are pressed with a thumb, so the padding is
          the tap target rather than decoration — negative margin keeps the row
          sitting where it looks like it should. */}
      <div className="-mb-2 mt-2 flex items-center justify-between gap-4 text-sm">
        {/* Its own form: a button inside the one above would send the code
            field to the wrong action, and forms do not nest. */}
        <form action={resend}>
          <input type="hidden" name="phone" value={phone} />
          <button
            type="submit"
            // An SMS costs money and arrives on somebody's phone whether they
            // asked for it or not, so the button is closed until the message
            // has had time to arrive. The backend refuses a fourth code an hour
            // regardless; this is what stops a person spending their three in
            // ten seconds and then waiting an hour.
            disabled={left > 0 || resending}
            className="py-2 font-medium text-ink underline underline-offset-4 transition-colors hover:text-ink-2 disabled:text-ink-3 disabled:no-underline"
          >
            {left > 0 ? t("resendIn", { seconds: left }) : t("resend")}
          </button>
        </form>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 py-2 text-ink-3 transition-colors hover:text-ink"
        >
          <Pencil className="size-3.5" strokeWidth={2} />
          {t("changeNumber")}
        </button>
      </div>
    </>
  );
}
