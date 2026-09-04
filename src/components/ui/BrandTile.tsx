// A platform's own mark, on its own colour, at the size of an app icon.
//
// Not an outline glyph in a neutral square. The point of this layout is that a
// person recognises where they are going before they read anything — the way
// they find an app on their own home screen — and that only works if the tile
// is the mark: white on Telegram's blue, white on WhatsApp's green, the camera
// on Instagram's gradient.
//
// Nominative use. Each of these marks identifies the service a link points at,
// which is what its owner publishes it for and what every "share to" button on
// the web does. It is a different thing from printing somebody's marque on a
// product for sale, which this project refuses and the local competitor does.
//
// The two local payment brands are set as wordmarks in their own colour rather
// than as invented glyphs: a logo I have not got is a logo I should not draw.

export type BrandId =
  | "telegram"
  | "instagram"
  | "whatsapp"
  | "youtube"
  | "linkedin"
  | "facebook"
  | "phone"
  | "sms"
  | "payme"
  | "click"
  | "uzum";

type Brand = {
  name: string;
  /** The tile's ground. A gradient where the mark's own ground is one. */
  fill: string;
  mark: React.ReactNode;
};

const W = { fill: "#fff" };

export const BRANDS: Record<BrandId, Brand> = {
  telegram: {
    name: "Telegram",
    fill: "#229ED9",
    mark: (
      <path
        {...W}
        d="M43.9 12.4 37.4 45c-.5 2.2-1.8 2.7-3.6 1.7l-10-7.4-4.8 4.6c-.5.5-1 1-2 1l.7-10.2 18.5-16.7c.8-.7-.2-1.1-1.3-.4L12 30.8 2 27.7c-1.7-.5-1.8-1.7.4-2.6L41.4 10c1.4-.5 2.7.3 2.5 2.4Z"
      />
    ),
  },
  instagram: {
    name: "Instagram",
    // The mark's own ground is a gradient; flattening it to one purple is the
    // thing that makes a copied icon look copied.
    fill: "linear-gradient(45deg,#FFC107 0%,#F44336 40%,#9C27B0 75%,#3F51B5 100%)",
    mark: (
      <>
        <rect x="9" y="9" width="30" height="30" rx="9" fill="none" stroke="#fff" strokeWidth="3.4" />
        <circle cx="24" cy="24" r="7.4" fill="none" stroke="#fff" strokeWidth="3.4" />
        <circle cx="33.2" cy="14.8" r="2.2" {...W} />
      </>
    ),
  },
  whatsapp: {
    name: "WhatsApp",
    fill: "#25D366",
    mark: (
      <path
        {...W}
        d="M24 8c-8.8 0-16 7.2-16 16 0 2.8.7 5.4 2 7.7L8 40l8.6-2.2c2.2 1.2 4.7 1.9 7.4 1.9 8.8 0 16-7.2 16-16S32.8 8 24 8Zm9.2 22.3c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.9.2-3-.2-.7-.2-1.6-.5-2.8-1-4.9-2.1-8.1-7-8.3-7.3-.2-.3-2-2.6-2-5s1.3-3.6 1.7-4.1c.4-.5 1-.6 1.3-.6h.9c.3 0 .7-.1 1.1.8l1.5 3.6c.1.3.2.6 0 1l-.6.9-.4.5c-.2.2-.4.5-.2.9.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 1.9.4.2.6.2.9-.1l1.2-1.5c.3-.4.6-.3 1-.2l3.4 1.6c.5.2.8.4.9.6.1.2.1 1-.3 2.1Z"
      />
    ),
  },
  youtube: {
    name: "YouTube",
    fill: "#FF0000",
    mark: (
      <>
        <rect x="6" y="12" width="36" height="24" rx="7" {...W} />
        <path d="M20 19.5v9l8-4.5-8-4.5Z" fill="#FF0000" />
      </>
    ),
  },
  linkedin: {
    name: "LinkedIn",
    fill: "#0A66C2",
    mark: (
      <>
        <rect x="9" y="19" width="6" height="20" {...W} />
        <circle cx="12" cy="12.5" r="3.6" {...W} />
        <path
          {...W}
          d="M20 19h5.8v2.7c.8-1.5 2.7-3.1 5.6-3.1 6 0 7.1 3.9 7.1 9V39h-6v-9.4c0-2.2 0-5.1-3.1-5.1s-3.6 2.4-3.6 4.9V39h-5.8V19Z"
        />
      </>
    ),
  },
  facebook: {
    name: "Facebook",
    fill: "#1877F2",
    mark: (
      <path
        {...W}
        d="M27.6 41V26.2h5l.8-5.8h-5.8v-3.7c0-1.7.5-2.8 2.9-2.8h3.1V8.4c-.5-.1-2.4-.2-4.6-.2-4.5 0-7.6 2.8-7.6 7.8v4.4h-5v5.8h5V41h6.2Z"
      />
    ),
  },
  phone: {
    name: "Qo'ng'iroq",
    fill: "#34C759",
    mark: (
      <path
        {...W}
        d="M15.6 10c1 0 1.9.6 2.3 1.5l2.5 5.8c.4 1 .1 2.1-.7 2.8l-2.4 2c-.5.4-.6 1-.4 1.6a20.6 20.6 0 0 0 9.9 9.9c.6.2 1.2.1 1.6-.4l2-2.4c.7-.8 1.8-1.1 2.8-.7l5.8 2.5c.9.4 1.5 1.3 1.5 2.3v4.7c0 1.4-1.1 2.5-2.5 2.5C21.5 42 6 26.5 6 12.5 6 11.1 7.1 10 8.5 10h7.1Z"
      />
    ),
  },
  sms: {
    name: "SMS",
    fill: "#30B0C7",
    mark: (
      <path
        {...W}
        d="M24 8C14.6 8 7 14.5 7 22.5c0 4.5 2.4 8.5 6.2 11.1-.3 2.4-1.3 4.6-2.8 6.3-.3.4 0 1 .5.9 3.6-.6 6.5-2.2 8.4-3.6 1.5.4 3.1.6 4.7.6 9.4 0 17-6.5 17-14.5S33.4 8 24 8Z"
      />
    ),
  },
  payme: {
    name: "Payme",
    fill: "#00CFCF",
    mark: null,
  },
  click: {
    name: "Click",
    fill: "#0071CE",
    mark: null,
  },
  uzum: {
    name: "Uzum",
    fill: "#7000FF",
    mark: null,
  },
};

export default function BrandTile({
  id,
  href,
  label,
}: {
  id: BrandId;
  href: string;
  /** Read by a screen reader and by nobody else — the tile carries no text. */
  label?: string;
}) {
  const b = BRANDS[id];

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      aria-label={label ?? b.name}
      // 22% of the width, which is the corner an app icon actually has — a
      // fixed radius makes a small tile look round and a large one look square.
      className="block aspect-square w-full overflow-hidden rounded-[22%] shadow-photo transition-transform active:translate-y-px"
      style={{ background: b.fill }}
    >
      {b.mark ? (
        <svg viewBox="0 0 48 48" className="size-full p-[18%]" aria-hidden>
          {b.mark}
        </svg>
      ) : (
        // No mark of theirs to hand, so the name is set as type rather than
        // guessed at as a glyph. A logo I have not got is a logo I must not
        // draw.
        <span className="flex size-full items-center justify-center px-1 text-center text-[clamp(11px,3.4vw,15px)] font-bold tracking-[-0.02em] text-white">
          {b.name}
        </span>
      )}
    </a>
  );
}
