"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  askDesign,
  type AskState,
} from "@/app/(cabinet)/[locale]/cabinet/[handle]/theme/actions";

const MAX = 400;

// A box for what the card should look like, and one button.
//
// Keyed on the action's counter so it empties once the wish is queued and
// keeps its text after a refusal — a person who wrote four lines about a
// pattern from their grandmother's suzani should not have to write them
// twice because the server was busy.
export default function DesignWish({ raqam }: { raqam: string }) {
  const t = useTranslations("cabinet.design");
  const [state, action, pending] = useActionState<AskState, FormData>(
    askDesign.bind(null, raqam),
    { key: 0 },
  );

  useEffect(() => {
    if (!state.result) return;
    if (state.result === "ok") toast.success(t("asked"));
    else toast.error(t(`error.${state.result}`));
  }, [state, t]);

  return (
    <form action={action} className="flex flex-col gap-2">
      <Textarea
        key={state.key}
        name="wish"
        required
        minLength={3}
        maxLength={MAX}
        rows={3}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="rounded-input px-3 py-2.5 text-base"
      />
      <Button
        type="submit"
        variant="outline"
        size="lg"
        disabled={pending}
        className="h-11 self-end rounded-input px-6"
      >
        {pending ? t("asking") : t("ask")}
      </Button>
    </form>
  );
}
