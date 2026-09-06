import { Clock, ExternalLink, Lock, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import CardFace from "@/components/CardFace";
import ShareButton from "./ShareButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { count, initials } from "@/lib/cabinet/format";
import type { OwnedHandle } from "@/lib/cabinet/handles";
import type { PlanState } from "@/lib/cabinet/plan";
import { DEFAULT_CARD_DESIGN, isCardDesign } from "@/lib/card-designs";
import { imageSrc } from "@/lib/profile/links";
import { SITE_HOST, profileUrl } from "@/lib/site";

// The number, as the owner sees it: physical NFC card preview, name, plate,
// and current state.
//
// Shows the actual high-resolution engraved CardFace so the owner experiences
// their tangible luxury NFC card right at the top of their cabinet.
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
  const design = isCardDesign(handle.dizayn)
    ? handle.dizayn
    : DEFAULT_CARD_DESIGN;

  return (
    <section className="relative flex flex-col gap-5 overflow-hidden rounded-tile border border-border/80 bg-card p-5 shadow-slab sm:p-6">
      {/* Real NFC physical card showcase with ambient glow */}
      <div className="relative mx-auto w-full">
        <div
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-card bg-gradient-to-r from-lime/25 via-gold/15 to-lime/25 blur-xl opacity-60"
        />
        <div className="relative overflow-hidden rounded-card border border-white/10 shadow-2xl transition-transform duration-200 active:scale-[0.99]">
          <CardFace
            design={design}
            handle={handle.raqam}
            sizes="(max-width: 640px) 100vw, 560px"
          />
        </div>
      </div>

      {/* Owner identity & status */}
      <div className="flex items-start gap-3.5 pt-1">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            width={52}
            height={52}
            className="size-13 shrink-0 rounded-full object-cover ring-2 ring-border/80"
          />
        ) : (
          <span className="flex size-13 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-lg font-semibold text-muted-foreground ring-1 ring-border">
            {initials(handle.ism)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {handle.ism || handle.raqam}
            </h1>
            {plan.tier === "premium" && (
              <Badge className="border-gold/40 bg-gold/15 text-gold text-[10px] font-semibold tracking-wider uppercase">
                <Sparkles className="size-2.5" />
                {t("state.premium")}
              </Badge>
            )}
          </div>

          {role && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {role}
            </p>
          )}

          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums font-medium text-foreground/90">
              {count(handle.korishlar)}
            </span>{" "}
            {t("home.views")} ·{" "}
            {t("home.followers", { count: followers, n: count(followers) })}
          </p>
        </div>
      </div>

      {/* Badges row if reserved or closed */}
      {(handle.holat === "reserved" || handle.yopiq) && (
        <div className="flex flex-wrap gap-1.5">
          {handle.holat === "reserved" && (
            <Badge variant="outline" className="text-warn border-warn/40">
              <Clock aria-hidden strokeWidth={2} />
              {t("state.reserved")}
            </Badge>
          )}
          {handle.yopiq && (
            <Badge variant="secondary" className="gap-1">
              <Lock aria-hidden strokeWidth={2} className="size-3" />
              {t("state.closed")}
            </Badge>
          )}
        </div>
      )}

      {/* The address bar */}
      <p className="flex items-baseline justify-between rounded-plate border border-border/60 bg-muted/60 px-3.5 py-2 font-mono text-xs text-muted-foreground">
        <span>{SITE_HOST}/</span>
        <span className="font-semibold tracking-[0.16em] text-foreground">
          {handle.raqam}
        </span>
      </p>

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button asChild size="lg" className="bg-lime text-ink font-semibold hover:bg-lime-press shadow-sm">
          <a href={url} target="_blank" rel="noreferrer noopener">
            <ExternalLink data-icon="inline-start" strokeWidth={2.25} />
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
