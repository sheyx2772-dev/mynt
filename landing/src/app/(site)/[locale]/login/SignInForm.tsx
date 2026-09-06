"use client";

import { useActionState, useState } from "react";

import { requestCode, type AskState } from "./actions";
import CodeStep from "./CodeStep";
import PhoneStep from "./PhoneStep";

const START: AskState = {};

/**
 * Two steps, one page.
 *
 * The number and the code are one act, so they are one address: a second route
 * for the code would be a page somebody can land on with nothing sent, and a
 * back button that loses the number they just typed. Which step is showing is
 * whether a code has gone out — not a route, not a query parameter.
 */
export default function SignInForm({
  language,
  handle,
}: {
  language: string;
  handle: string | null;
}) {
  const [ask, askAction, sending] = useActionState<AskState, FormData>(
    requestCode,
    START,
  );

  // The digits, kept here rather than in the field, because both steps need
  // them: the second one posts the number back with the code, and coming back
  // to correct a typo must not hand somebody an empty field to retype.
  const [phone, setPhone] = useState("998");

  // Asking to change the number is a decision about the code that just went
  // out, so it is remembered as which send it was taken against. The next code
  // carries a new stamp and the reader is on the second step again — worked out
  // while rendering rather than reset afterwards, because resetting it when the
  // form is submitted would show the second step, addressed to the old number,
  // for as long as the request takes.
  const [editingSince, setEditingSince] = useState<number | null>(null);

  const sent = ask.sent;
  const editing = sent !== undefined && editingSince === sent.at;

  if (!sent || editing) {
    return (
      <PhoneStep
        value={phone}
        onValue={setPhone}
        action={askAction}
        busy={sending}
        error={ask.error}
      />
    );
  }

  return (
    <CodeStep
      language={language}
      handle={handle}
      phone={sent.phone}
      sentAt={sent.at}
      resend={askAction}
      resending={sending}
      resendError={ask.error}
      onEdit={() => setEditingSince(sent.at)}
      prefill={sent.code}
    />
  );
}
