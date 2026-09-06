"use client";

import { useId, useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import StrangerPreview, { type PreviewProfile } from "./StrangerPreview";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  setClosed,
  setCommentsOpen,
} from "@/app/(cabinet)/[locale]/cabinet/[handle]/privacy/actions";

// The closed-profile switch, with the consequence drawn next to it.
//
// Flipping it changes the preview at once and saves in the background; if the
// save fails the switch falls back and says so. Optimistic on purpose: the
// point of this screen is that the owner sees what a stranger will see at the
// moment they decide, and a switch that waits a round trip before the preview
// moves has broken the link between the two.
export default function PrivacySwitch({
  raqam,
  closed,
  commentsOpen,
  profile,
}: {
  raqam: string;
  closed: boolean;
  commentsOpen: boolean;
  profile: PreviewProfile;
}) {
  const t = useTranslations("cabinet.privacy");
  const [pending, start] = useTransition();
  const [isClosed, showClosed] = useOptimistic(closed);
  const [comments, showComments] = useOptimistic(commentsOpen);
  const closedId = useId();
  const commentsId = useId();

  const flipClosed = (next: boolean) =>
    start(async () => {
      showClosed(next);
      const result = await setClosed(raqam, next);
      if (result === "ok") toast.success(next ? t("nowClosed") : t("nowOpen"));
      else toast.error(t("notSaved"));
    });

  const flipComments = (next: boolean) =>
    start(async () => {
      showComments(next);
      const result = await setCommentsOpen(raqam, next);
      if (result !== "ok") toast.error(t("notSaved"));
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor={closedId} className="flex-col items-start gap-1">
            <span className="text-[15px]">{t("closed")}</span>
            <span className="text-xs leading-4 font-normal text-muted-foreground">
              {t("closedHint")}
            </span>
          </Label>
          <Switch
            id={closedId}
            checked={isClosed}
            onCheckedChange={flipClosed}
            disabled={pending}
            className="h-7 w-12 data-[size=default]:h-7 data-[size=default]:w-12 [&_[data-slot=switch-thumb]]:size-6"
          />
        </div>

        <StrangerPreview closed={isClosed} profile={profile} />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-card border border-border bg-card p-4 sm:p-5">
        <Label htmlFor={commentsId} className="flex-col items-start gap-1">
          <span className="text-[15px]">{t("comments")}</span>
          <span className="text-xs leading-4 font-normal text-muted-foreground">
            {t("commentsHint")}
          </span>
        </Label>
        <Switch
          id={commentsId}
          checked={comments}
          onCheckedChange={flipComments}
          disabled={pending}
          className="h-7 w-12 data-[size=default]:h-7 data-[size=default]:w-12 [&_[data-slot=switch-thumb]]:size-6"
        />
      </div>
    </div>
  );
}
