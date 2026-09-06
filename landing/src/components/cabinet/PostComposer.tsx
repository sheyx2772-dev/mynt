"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  compose,
  type ComposeState,
} from "@/app/(cabinet)/[locale]/cabinet/[handle]/posts/actions";

const MAX = 1000;

// A box and a button.
//
// The textarea is keyed on the action's counter so it empties after a post
// lands and keeps its text after a refusal — the one case where clearing it
// would be losing what somebody just wrote because the hourly limit said no.
export default function PostComposer({ raqam }: { raqam: string }) {
  const t = useTranslations("cabinet.posts");
  const [state, action, pending] = useActionState<ComposeState, FormData>(
    compose.bind(null, raqam),
    { key: 0 },
  );

  useEffect(() => {
    if (!state.result) return;
    if (state.result === "ok") toast.success(t("posted"));
    else toast.error(t(`error.${state.result}`));
  }, [state, t]);

  return (
    <form action={action} className="flex flex-col gap-2">
      <Textarea
        key={state.key}
        name="text"
        required
        maxLength={MAX}
        rows={4}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="rounded-input px-3 py-2.5 text-base"
      />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 self-end rounded-input px-6"
      >
        {pending ? t("posting") : t("post")}
      </Button>
    </form>
  );
}
