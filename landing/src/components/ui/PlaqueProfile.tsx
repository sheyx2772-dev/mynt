import { Nfc } from "lucide-react";

import LinkIcon from "@/components/LinkIcon";
import Plate from "@/components/ui/Plate";

// The ceremonial layout.
//
// The other one is a card with paperwork slid under it: left-aligned, sans,
// solid buttons, a white sheet. Right for somebody handing a card to a client,
// wrong for everybody else — a photographer, a restaurant, a person who bought
// the number because it is a good number wants a certificate, not a form.
//
// On the type scale. The rest of this product has a floor of 16px, written for
// the guest face: a stranger reading a stranger's card outdoors, in sun, on a
// cheap phone. That floor is wrong here and it was making this layout look
// coarse — everything landed between 16 and 18, so nothing was subordinate to
// anything and the panel stretched to twice the height it needed. This face is
// read on a dark panel by somebody who chose to open it, and its labels go
// down to 12: badge 12, stat label 12, role 13, tabs 14, stat figure 24, name
// 30. Five distinct steps instead of two.
//
// The floor still holds where it was actually protecting something. Every pill
// is 48px tall whatever its text does, because the target is the pill and not
// the words in it, and the bio — the only real prose here — stays at 15.

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
    "flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-gold/45 px-5 font-serif text-[13px] font-bold tracking-[0.09em] text-gold uppercase transition-colors active:bg-gold/10";

  // The contents follow the panel up, a row at a time. Capped: past the sixth
  // step nobody is watching the stagger, they are waiting for it.
  let beat = 0;
  const step = () => ({ animationDelay: `${Math.min(beat++, 6) * 55 + 90}ms` });

  return (
    <div className="mx-auto w-full max-w-[420px] px-4 py-8">
      <div className="enter rounded-[20px] border border-gold/25 p-1.5">
        {/* The rule sits inset from the panel's edge rather than on it. That is
            what makes a printed certificate look printed: the border is not the
            trim, it is a line struck inside the trim. */}
        <div className="rounded-[15px] border border-dashed border-gold/25 px-5 py-6 text-center">
          {badges && badges.length > 0 && (
            <div className="rise-in mb-6 flex flex-wrap items-center justify-center gap-2" style={step()}>
              {badges.map((b) => {
                const cls = `${pill} min-h-9 whitespace-nowrap px-4 text-[12px] tracking-[0.06em]`;
                return b.href ? (
                  <a key={b.label} href={b.href} className={cls}>
                    {b.label}
                  </a>
                ) : (
                  <span key={b.label} className={cls}>
                    {b.label}
                  </span>
                );
              })}
            </div>
          )}

          <div className="rise-in flex items-center justify-center gap-2.5 text-gold/70" style={step()}>
            <span className="h-px w-7 bg-gold/40" aria-hidden />
            <span className="font-serif text-[12px] tracking-[0.3em] uppercase">Flex</span>
            <Nfc className="size-3.5" />
            <span className="h-px w-7 bg-gold/40" aria-hidden />
          </div>

          <div className="rise-in mt-5 flex justify-center" style={step()}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
              <img
                src={avatarUrl}
                alt={name}
                width={104}
                height={104}
                className="size-26 rounded-full border-2 border-gold/30 object-cover"
              />
            ) : (
              <div className="flex size-26 items-center justify-center rounded-full border-2 border-gold/30 font-serif text-[32px] text-gold">
                {initials}
              </div>
            )}
          </div>

          <div className="rise-in" style={step()}>
            <h1 className="mt-4 font-serif text-[clamp(28px,8vw,32px)] leading-[1.08] tracking-[-0.03em] text-gold text-balance">
              {name}
            </h1>

            {lastSeen && (
              <p className="mt-1.5 font-serif text-[13px] leading-5 text-mute">{lastSeen}</p>
            )}

            {(role || company) && (
              <p className="mt-1 font-serif text-[13px] leading-5 tracking-[0.1em] uppercase">
                {[role, company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {stats && stats.length > 0 && (
            <dl className="rise-in mt-5 flex items-start justify-center gap-10" style={step()}>
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="font-serif text-[24px] leading-none font-black tabular-nums">
                    {s.value}
                  </dd>
                  <dt className="mt-1 font-serif text-[12px] tracking-[0.02em] text-mute">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}

          <div className="rise-in mt-5 flex justify-center" style={step()}>
            <Plate n={n} size="sm" mark={false} />
          </div>

          {bio && (
            <p className="rise-in mx-auto mt-4 max-w-[32ch] font-serif text-[15px] leading-relaxed text-pretty" style={step()}>
              {bio}
            </p>
          )}

          {tabs && tabs.length > 0 && (
            <div className="rise-in mt-6 flex justify-center gap-7 border-b border-gold/20" style={step()}>
              {tabs.map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  className={
                    t.active
                      ? "-mb-px border-b-2 border-gold pb-2.5 font-serif text-[14px] font-bold text-gold"
                      : "-mb-px border-b-2 border-transparent pb-2.5 font-serif text-[14px] font-bold text-mute"
                  }
                >
                  {t.label}
                </a>
              ))}
            </div>
          )}

          {links && links.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2.5">
              {links.map((l) => (
                <li key={l.href + l.text} className="rise-in" style={step()}>
                  <a href={l.href} className={pill}>
                    <LinkIcon label={l.label} className="size-4 shrink-0" />
                    {l.text}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {children && (
            <div className="rise-in mt-5" style={step()}>
              {children}
            </div>
          )}

          <p className="rise-in mt-6 font-serif text-[14px] font-bold text-gold/70 underline underline-offset-4" style={step()}>
            #{n.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The outlined pill this layout uses instead of a struck slab. */
export const plaquePill =
  "flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-gold/45 px-5 font-serif text-[13px] font-bold tracking-[0.09em] text-gold uppercase transition-colors active:bg-gold/10";
