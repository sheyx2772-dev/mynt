import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

// What the number is carried on.
//
// A shelf, not the carousel the old site had. The carousel rotated through
// twenty-nine objects and said "we have twenty-nine"; a shelf says "you want
// this one". Somebody deciding whether to buy is choosing between four things,
// not browsing a catalogue — and the catalogue is a page of its own, linked at
// the end, for the person who wants it.
//
// The objects are drawn. The photographs are 704x396 and 900x900 at source and
// go soft the moment they are shown at any size worth showing. These are flat
// and stroked, sharp at any size, and they carry the one thing a photograph of
// a black card cannot: where the contactless mark sits on each.

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="w-full text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** The signal, in the corner it is read from. Lime, on every object. */
const WAVES = (
  <g stroke="var(--color-lime-ink)" strokeWidth={1.75}>
    <path d="M45 27a7 7 0 0 1 0 10" />
    <path d="M49 23.5a12 12 0 0 1 0 17" />
  </g>
);

const CARD = (
  <>
    <rect x="8" y="18" width="48" height="30" rx="4" />
    <path d="M14 40h10" stroke="var(--color-line-lead)" />
    {WAVES}
  </>
);

const RING = (
  <>
    <circle cx="32" cy="34" r="16" />
    <circle cx="32" cy="34" r="11" stroke="var(--color-line-lead)" />
    <path d="M24 20h16l-2 5H26z" />
    {WAVES}
  </>
);

const BAND = (
  <>
    <path d="M20 20a12 12 0 0 0 0 28" />
    <path d="M44 20a12 12 0 0 1 0 28" />
    <rect x="20" y="24" width="24" height="20" rx="4" />
    {WAVES}
  </>
);

const STICKER = (
  <>
    <circle cx="32" cy="34" r="17" />
    <circle cx="32" cy="34" r="12" strokeDasharray="2 3" stroke="var(--color-line-lead)" />
    {WAVES}
  </>
);

const SHELF = [CARD, RING, BAND, STICKER];

export default async function Devices() {
  const t = await getTranslations("devices");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="cap text-ink-3">{t("eyebrow")}</p>
      <p className="mt-2 max-w-xl text-ink-2">{t("note")}</p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {SHELF.map((glyph, i) => (
          <li key={i}>
            <Link
              href="/devices"
              className="group flex h-full flex-col rounded-card border border-line bg-white p-5 transition-colors hover:border-line-lead"
            >
              <div className="px-4 py-2">
                <Glyph>{glyph}</Glyph>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-2">
                <span className="font-semibold">{t(`name${i + 1}`)}</span>
                <span className="font-mono text-[13px] tracking-[0.06em] text-ink-3">
                  {t(`price${i + 1}`)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/devices"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
      >
        {t("seeAll")}
        <ArrowRight className="size-4" strokeWidth={2} />
      </Link>
    </section>
  );
}
