import { Clock, ExternalLink, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import ShareButton from "./ShareButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { count, initials } from "@/lib/cabinet/format";
import type { OwnedHandle } from "@/lib/cabinet/handles";
import type { PlanState } from "@/lib/cabinet/plan";
import { imageSrc } from "@/lib/profile/links";
import { SITE_HOST, profileUrl } from "@/lib/site";

// The number, as the owner sees it: face, name, plate, and what state it is in.
//
// Deliberately close to the top of the public profile, so the owner
// recognises their own page here, and different in one respect — the badges
// say what a stranger is not told: whether it is paid for, whether it is
// closed, whether the hold has cleared. The plate is the product and gets the
// mono face and the tracking the card is engraved with.
//
// Two figures the public page also shows — views all time, and who follows —
// because the owner recognises their page by them. The week's figures are
// below, in their own row.
export default async function NumberCard({
  handle,
  plan,
  followers,
}: {
  handle: OwnedHandle;
  plan: PlanState;
  followers: number;
}) {
  const t = await getTranslations("cabinet");
  const avatar = imageSrc(handle.rasm);
  const role = [handle.lavozim, handle.kompaniya].filter(Boolean).join(" · ");
  const url = profileUrl(handle.raqam);

  return (
    <section className="rounded-tile bg-card p-5 shadow-slab sm:p-6">
      <div className="flex items-start gap-4">
        {avatar ? (
          // Not next/image: one picture, already sized by the uploader, on our
          // own object store. See ProfileHeader for the same call.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xl font-semibold text-muted-foreground">
            {initials(handle.ism)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {handle.ism || handle.raqam}
          </h1>
          {role && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {role}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">
              {count(handle.korishlar)}
            </span>{" "}
            {t("home.views")} ·{" "}
            {t("home.followers", { count: followers, n: count(followers) })}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {handle.holat === "reserved" ? (
              <Badge variant="outline" className="text-warn">
                <Clock aria-hidden strokeWidth={2} />
                {t("state.reserved")}
              </Badge>
            ) : plan.tier === "premium" ? (
              <Badge className="border-transparent bg-gold text-ink">
                {t("state.premium")}
              </Badge>
            ) : (
              <Badge variant="secondary">{t("state.free")}</Badge>
            )}
            {handle.yopiq && (
              <Badge variant="secondary">
                <Lock aria-hidden strokeWidth={2} />
                {t("state.closed")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* The address, in the face it is engraved in. */}
      <p className="mt-5 flex items-baseline gap-2 rounded-plate bg-muted px-3.5 py-2 font-mono text-sm">
        <span className="text-muted-foreground">{SITE_HOST}/</span>
        <span className="font-semibold tracking-[0.18em] text-foreground">
          {handle.raqam}
        </span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="lg">
          {/* The engraved address, not a site path: a profile has no locale. */}
          <a href={url} target="_blank" rel="noreferrer noopener">
            <ExternalLink data-icon="inline-start" strokeWidth={2} />
            {t("home.view")}
          </a>
        </Button>
        <ShareButton
          url={url}
          title={handle.ism || handle.raqam}
          label={t("home.share")}
          copied={t("home.copied")}
        />
      </div>
    </section>
  );
}
