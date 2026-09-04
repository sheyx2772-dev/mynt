import { Nfc } from "lucide-react";

import LinkIcon from "@/components/LinkIcon";
import Plate from "@/components/ui/Plate";

// The ceremonial layout.
//
// The other one is a card with paperwork slid under it: left-aligned, sans,
// solid buttons, a white sheet. It is right for somebody handing a card to a
// client and wrong for everybody else — a photographer, a restaurant, a person
// who bought the number because it is a good number does not want a form. They
// want a certificate.
//
// So this is built differently rather than painted differently. Centred on its
// axis. A serif in gold for the name. Hairline outlined pills instead of
// struck slabs, each carrying its platform's glyph on the left. A round
// portrait in a ring instead of a square print. No sheet at all: the page is
// one panel, the way a certificate is one piece of card, with a rule inset
// from its edge the way an engraved invitation has one.
//
// The badges at the top are the only place this layout says anything about
// status, and they are pills rather than a bar because the page has no bars on
// it anywhere else.

export type PlaqueLink = { label: string; text: string; href: string };

export default function PlaqueProfile({
  n,
  name,
  role,
  company,
  bio,
  lastSeen,
  avatarUrl,
  badges,
  stats,
  tabs,
  links,
  children,
}: {
  n: string;
  name: string;
  role?: string | null;
  company?: string | null;
  bio?: string | null;
  lastSeen?: string | null;
  avatarUrl?: string | null;
  /** Rank, subscribe — the two things this layout will say about standing. */
  badges?: { label: string; href?: string }[];
  stats?: { value: string; label: string }[];
  tabs?: { label: string; active: boolean; href: string }[];
  links?: PlaqueLink[];
  children?: React.ReactNode;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  const pill =
    "flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-gold/45 px-5 py-2.5 font-serif text-[16px] font-bold tracking-[0.06em] text-gold uppercase transition-colors active:bg-gold/10";

  return (
    <div className="mx-auto w-full max-w-[460px] px-4 py-8">
      {/* The rule sits inset from the panel's edge rather than on it. That is
          what makes a printed certificate look printed: the border is not the
          trim, it is a line struck inside the trim. */}
      <div className="rounded-[20px] border border-gold/25 p-1.5">
        <div className="rounded-[15px] border border-dashed border-gold/25 px-5 py-7 text-center">
          {badges && badges.length > 0 && (
            <div className="mb-7 flex flex-wrap items-center justify-center gap-3">
              {badges.map((b) =>
                b.href ? (
                  <a
                    key={b.label}
                    href={b.href}
                    className={`${pill} whitespace-nowrap px-4`}
                  >
                    {b.label}
                  </a>
                ) : (
                  <span key={b.label} className={`${pill} whitespace-nowrap px-4`}>
                    {b.label}
                  </span>
                ),
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 text-gold/70">
            <span className="h-px w-8 bg-gold/40" aria-hidden />
            <span className="font-serif text-[16px] tracking-[0.32em] uppercase">
              Flex
            </span>
            <Nfc className="size-4 rotate-90" />
            <span className="h-px w-8 bg-gold/40" aria-hidden />
          </div>

          <div className="mt-6 flex justify-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
              <img
                src={avatarUrl}
                alt={name}
                width={112}
                height={112}
                className="size-28 rounded-full border-2 border-gold/40 object-cover"
              />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-full border-2 border-gold/40 font-serif text-[36px] text-gold">
                {initials}
              </div>
            )}
          </div>

          <h1 className="mt-5 font-serif text-[34px] leading-tight text-gold text-balance">
            {name}
          </h1>

          {lastSeen && (
            <p className="mt-1.5 font-serif text-[16px] tracking-[0.06em] text-mute">
              {lastSeen}
            </p>
          )}

          {(role || company) && (
            <p className="mt-1.5 font-serif text-[18px] tracking-[0.08em] uppercase">
              {[role, company].filter(Boolean).join(" · ")}
            </p>
          )}

          {stats && stats.length > 0 && (
            <dl className="mt-6 flex items-start justify-center gap-12">
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="font-serif text-[26px] leading-none font-bold tabular-nums">
                    {s.value}
                  </dd>
                  <dt className="mt-1.5 font-serif text-[16px] text-mute">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 flex justify-center">
            <Plate n={n} size="md" mark={false} />
          </div>

          {bio && (
            <p className="mx-auto mt-5 max-w-[34ch] font-serif text-[18px] leading-relaxed text-pretty">
              {bio}
            </p>
          )}

          {tabs && tabs.length > 0 && (
            <div className="mt-7 flex justify-center gap-8 border-b border-gold/20">
              {tabs.map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  className={
                    t.active
                      ? "-mb-px border-b-2 border-gold pb-3 font-serif text-[18px] font-bold text-gold"
                      : "-mb-px border-b-2 border-transparent pb-3 font-serif text-[18px] text-mute"
                  }
                >
                  {t.label}
                </a>
              ))}
            </div>
          )}

          {links && links.length > 0 && (
            <ul className="mt-6 flex flex-col gap-3">
              {links.map((l) => (
                <li key={l.href + l.text}>
                  <a href={l.href} className={pill}>
                    <LinkIcon label={l.label} className="size-5 shrink-0" />
                    {l.text}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {children && <div className="mt-7">{children}</div>}

          <p className="mt-8 font-serif text-[18px] font-bold text-gold/70 underline underline-offset-4">
            #{n.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The outlined pill this layout uses instead of a struck slab. */
export const plaquePill =
  "flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-gold/45 px-5 py-2.5 font-serif text-[16px] font-bold tracking-[0.06em] text-gold uppercase transition-colors active:bg-gold/10";
