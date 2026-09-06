import { getLocale, getTranslations } from "next-intl/server";

import DesignWish from "./DesignWish";
import { Badge } from "@/components/ui/badge";
import type { DesignRequest } from "@/lib/cabinet/design";
import { day } from "@/lib/cabinet/format";
import { imageSrc } from "@/lib/profile/links";

// The custom design: what was asked for, what came back, and asking.
//
// The artwork already on the number is shown first, because if there is one
// it is the answer to "what does my card look like" and the catalogue above
// is what it replaced. The queue is under it, newest first, each with its
// state; a refused one carries the studio's note so the next wish can be a
// better one. The form is offered only while nothing is in flight — the
// backend holds one pending request per number, and a form that would be
// refused is worse than a line saying why.
const STATES = new Set(["pending", "filled", "refused"]);

export default async function DesignRequests({
  raqam,
  artwork,
  requests,
}: {
  raqam: string;
  artwork?: string;
  requests: DesignRequest[];
}) {
  const [t, locale] = await Promise.all([
    getTranslations("cabinet.design"),
    getLocale(),
  ]);
  const picture = imageSrc(artwork);
  const inFlight = requests.some((r) => r.holat === "pending");

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("hint")}
        </p>
      </div>

      {picture && (
        // Not next/image: one picture, on our own object store, at the size
        // the studio exported it. See NumberCard for the same call.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picture}
          alt={t("artworkAlt")}
          className="aspect-[1.586] w-full rounded-card object-cover shadow-photo"
        />
      )}

      {requests.length > 0 && (
        <ul className="flex flex-col gap-2">
          {requests.map((r) => (
            <li key={r.id} className="rounded-card bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {r.tilak}
                </p>
                <Badge
                  variant={r.holat === "filled" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {STATES.has(r.holat) ? t(`state.${r.holat}`) : r.holat}
                </Badge>
              </div>
              {r.izoh && (
                <p className="mt-2 text-sm text-muted-foreground">{r.izoh}</p>
              )}
              <time
                dateTime={r.vaqt}
                className="mt-2 block text-xs text-muted-foreground"
              >
                {day(r.vaqt, locale)}
              </time>
            </li>
          ))}
        </ul>
      )}

      {inFlight ? (
        <p className="rounded-card border border-dashed border-border px-4 py-4 text-center text-sm text-muted-foreground">
          {t("inFlight")}
        </p>
      ) : (
        <DesignWish raqam={raqam} />
      )}
    </section>
  );
}
