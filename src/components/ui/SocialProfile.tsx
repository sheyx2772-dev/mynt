import Plate from "@/components/ui/Plate";
import BrandTile, { type BrandId } from "@/components/ui/BrandTile";

// The home screen.
//
// A photographer, a shop, a driver: their profile is a set of places to reach
// them, and the fastest way to hand somebody a set of places is the way every
// phone already does it — a grid of app icons. Full marks, own colours, four
// across, nothing written underneath.
//
// The labels are gone on purpose. A person does not read the word "Telegram"
// on their own home screen; they find the blue paper plane. Putting the name
// under every tile doubles the height of the grid to tell somebody something
// the tile already told them, and pushes the payment row below the fold.
//
// The name and the number stay, small, at the top and the bottom. The number
// is still what was bought — but on this layout it is the label on the back of
// the phone, not the headline.

export type Tile = { id: BrandId; href: string };

export default function SocialProfile({
  n,
  name,
  tagline,
  avatarUrl,
  reach,
  pay,
  children,
}: {
  n: string;
  name: string;
  tagline?: string | null;
  avatarUrl?: string | null;
  /** Where to find them. */
  reach: Tile[];
  /** How to pay them. Its own row, because it is a different kind of act. */
  pay?: Tile[];
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[460px] px-5 py-8">
      <div className="flex flex-col items-center text-center">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
          <img
            src={avatarUrl}
            alt={name}
            width={88}
            height={88}
            className="size-22 rounded-full object-cover shadow-photo"
          />
        ) : (
          <div className="flex size-22 items-center justify-center rounded-full bg-slab text-[28px] font-bold text-on-slab shadow-photo">
            {name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}

        <h1 className="mt-4 text-[24px] leading-tight font-bold tracking-[-0.02em]">
          {name}
        </h1>
        {tagline && <p className="mt-1 text-[16px] leading-6 text-mute">{tagline}</p>}
      </div>

      {/* Four across, which is what a phone does, and what makes the row read
          as a home screen rather than as a list of buttons. */}
      <ul className="mt-8 grid grid-cols-4 gap-4">
        {reach.map((t) => (
          <li key={t.id}>
            <BrandTile id={t.id} href={t.href} />
          </li>
        ))}
      </ul>

      {pay && pay.length > 0 && (
        <>
          <p className="mt-8 text-center text-[16px] leading-6 text-mute">
            To&apos;lov
          </p>
          <ul className="mt-3 grid grid-cols-4 gap-4">
            {pay.map((t) => (
              <li key={t.id}>
                <BrandTile id={t.id} href={t.href} />
              </li>
            ))}
          </ul>
        </>
      )}

      {children}

      <div className="mt-8 flex justify-center">
        <Plate n={n} size="sm" />
      </div>
    </div>
  );
}
