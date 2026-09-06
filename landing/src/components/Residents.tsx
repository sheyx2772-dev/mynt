import Image from "next/image";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { directory } from "@/lib/backend/residents";

// Who has just joined.
//
// The strongest thing an entry page can show a stranger is that somebody else
// already bought this, with a face and a name on it. So these are real rows
// from the real table, and when there are none the strip does not render — a
// row of placeholder faces would be exactly the lie the counter beside it
// exists to avoid.

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

/**
 * The face, or the initials standing in for it.
 *
 * A photo is only rendered when `next.config.ts` will let the optimiser fetch
 * it, which today means a path on this origin: the config declares no
 * `images.remotePatterns` at all, so an avatar sitting on the object store
 * falls back to initials until a precise host is added there.
 *
 * The tempting one-line fix is `remotePatterns: [{ hostname: "**" }]`, and it
 * is the thing that must not be done. Next's optimiser fetches the URL from
 * the server, so a wildcard turns this site into an open image proxy pointed
 * at whatever a profile owner typed into their avatar field — including
 * addresses only our own network can reach, the backend among them. Initials
 * are the cheap answer: a missing face costs a visitor nothing.
 *
 * `//host/path` is checked apart from `/path` because a protocol-relative URL
 * also begins with a slash and is not local at all.
 */
function Avatar({ name, photo }: { name: string; photo?: string }) {
  const local = photo?.startsWith("/") && !photo.startsWith("//");

  if (local && photo) {
    return (
      <Image
        src={photo}
        alt=""
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-semibold text-ink">
      {initials(name)}
    </span>
  );
}

export default async function Residents() {
  const dir = await directory();
  if (!dir || dir.newest.length === 0) return null;

  const t = await getTranslations("residents");

  return (
    <section className="mx-auto max-w-6xl py-16 sm:py-20">
      <div className="flex items-baseline justify-between gap-4 px-6">
        <p className="cap text-ink-3">{t("eyebrow")}</p>

        <Link
          href="/residents"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
        >
          {t("seeAll")}
          <ArrowRight className="size-4" strokeWidth={2} />
        </Link>
      </div>

      {/* One rail on a phone, a grid from `sm` up. Wrapping four cards onto
          two rows on a 360px screen buries the fourth below the fold; a rail
          keeps them all one thumb away and says there are more. The padding
          lives on the list rather than the section so the first and last card
          can sit against the margin and still scroll clear of it. */}
      <ul className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {dir.newest.slice(0, 4).map((r) => (
          <li key={r.raqam} className="w-60 shrink-0 snap-start sm:w-auto">
            {/* Plain next/link, absolute path: a profile lives outside the
                locale prefix, and `src/proxy.ts` says why. */}
            <NextLink
              href={`/${r.raqam}`}
              className="flex items-center gap-3 rounded-card border border-line bg-white p-3 transition-colors hover:border-line-2"
            >
              <Avatar name={r.ism} photo={r.rasm} />

              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">
                  {r.ism}
                </span>
                <span className="block truncate font-mono text-[13px] text-ink-3">
                  arend.uz/{r.raqam}
                </span>
              </span>
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
