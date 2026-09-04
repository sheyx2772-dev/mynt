import LinkIcon from "@/components/LinkIcon";
import Plate from "@/components/ui/Plate";
import { platformColour } from "@/lib/platform-colour";

// The layout for a profile that IS its accounts.
//
// A photographer, a shop, somebody who makes things and posts them: their
// links are not a footnote under a job title, they are the whole page. So the
// arrangement inverts. The name is small and the accounts are large — a grid
// of tiles, each wearing its own platform's colour and mark, big enough to hit
// with a thumb without reading.
//
// This is the one place in the product where a link is not monochrome. The
// rule elsewhere exists because six saturated bubbles on a director's card
// read as a toy; here the marks are the content, and a person hunting for
// Telegram finds it by its blue before they have read a word. Taking the
// colour out would make the page harder to use, not more tasteful.
//
// Card at the top still, small, because the number is still the product — but
// it is a stamp on this page rather than the headline.

type Social = { label: string; href: string; handle: string };

export default function SocialProfile({
  n,
  name,
  tagline,
  avatarUrl,
  socials,
  children,
}: {
  n: string;
  name: string;
  tagline?: string | null;
  avatarUrl?: string | null;
  socials: Social[];
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[460px] px-4 py-8">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
          <img
            src={avatarUrl}
            alt={name}
            width={72}
            height={72}
            className="size-18 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex size-18 shrink-0 items-center justify-center rounded-2xl bg-slab text-[24px] font-bold text-on-slab">
            {name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-tight font-bold tracking-[-0.02em]">
            {name}
          </h1>
          {tagline && (
            <p className="mt-0.5 text-[16px] leading-6 text-mute">{tagline}</p>
          )}
        </div>
      </div>

      {/* The accounts, and they are the page.
          Two columns rather than one: a list of nine rows is a list somebody
          scrolls past, a grid of nine tiles is something they scan. */}
      <ul className="mt-6 grid grid-cols-2 gap-3">
        {socials.map((s) => {
          const colour = platformColour(s.label);
          return (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-24 flex-col justify-between rounded-2xl bg-sheet p-4 shadow-photo transition-transform active:translate-y-px"
                // The mark's colour, on the mark alone. The tile stays the
                // sheet's own white — six coloured tiles would be a page with
                // no hierarchy at all, which is the thing the monochrome rule
                // was protecting against in the first place.
                style={colour ? ({ color: colour } as React.CSSProperties) : undefined}
              >
                <LinkIcon label={s.label} className="size-8" />
                <span className="mt-3 min-w-0">
                  <span className="block text-[16px] leading-5 font-semibold text-ink">
                    {s.label}
                  </span>
                  <span className="block truncate text-[16px] leading-5 text-mute">
                    {s.handle}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      {children}

      {/* The number, stamped at the foot rather than announced at the top. On
          this layout it is the receipt, not the headline. */}
      <div className="mt-8 flex justify-center">
        <Plate n={n} size="sm" />
      </div>
    </div>
  );
}
