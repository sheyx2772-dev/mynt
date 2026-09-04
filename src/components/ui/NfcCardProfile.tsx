import { Calendar, Link2, Mail, MapPin, Phone, Share2, UserPlus } from "lucide-react";

import LinkIcon from "@/components/LinkIcon";

// The layout the client supplied, rebuilt to the reference.
//
// Four of the images in nfcprofil are the same template carrying four
// different brands — ITPU in cyan, a ministry in blue, Uzbek Business Connect
// on an orange gradient, Ipoteka Bank in green — which is what makes it the
// design rather than one of the references beside it. Everything below is read
// off those four and changed nowhere: the band with the organisation's mark,
// the round portrait lapping its edge, the location pin on the right, name
// over organisation over role, a four-by-two grid of filled circles with the
// label under each, the two-up row, the full-width website button, the ruled
// divider with a mark in the middle, and the about block.
//
// The accent is a theme token, so the four brand colourways in the reference
// come from the theme rather than from four copies of this file.

export type GridAction = {
  /** Which glyph. The four platform names go to LinkIcon; the rest are ours. */
  kind: "email" | "call" | "calendar" | "connect" | string;
  label: string;
  href: string;
};

const OURS: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  calendar: Calendar,
  connect: Link2,
};

function ActionGlyph({ kind }: { kind: string }) {
  const Own = OURS[kind];
  if (Own) return <Own className="size-5" strokeWidth={2} />;
  return <LinkIcon label={kind} className="size-5" />;
}

export default function NfcCardProfile({
  name,
  org,
  role,
  bandImage,
  logo,
  avatarUrl,
  locationHref,
  actions,
  websiteHref,
  websiteLabel = "Website",
  about,
  labels,
}: {
  name: string;
  org?: string | null;
  role?: string | null;
  /** A photograph behind the band. Without one the band is the accent. */
  bandImage?: string | null;
  /** The organisation's mark, sat in the band. */
  logo?: React.ReactNode;
  avatarUrl?: string | null;
  locationHref?: string | null;
  actions: GridAction[];
  websiteHref?: string | null;
  websiteLabel?: string;
  about?: { title: string; body: string; logo?: React.ReactNode } | null;
  labels: { addToContacts: string; share: string };
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="mx-auto w-full max-w-[400px] overflow-hidden">
      {/* The band. Its mark sits in it, and the portrait laps its lower edge. */}
      <div className="relative h-28">
        {bandImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static file in public/, sized by CSS */}
            <img
              src={bandImage}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-ink/25" />
          </>
        ) : (
          <div aria-hidden className="absolute inset-0 bg-lime" />
        )}

        {logo && (
          <div className="relative flex h-full items-start justify-center pt-4">
            {logo}
          </div>
        )}
      </div>

      <div className="px-5 pb-8">
        <div className="relative -mt-11 flex items-end justify-center">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
            <img
              src={avatarUrl}
              alt={name}
              width={88}
              height={88}
              className="size-22 rounded-full border-4 border-paper object-cover"
            />
          ) : (
            <div className="flex size-22 items-center justify-center rounded-full border-4 border-paper bg-slab text-[26px] font-bold text-on-slab">
              {initials}
            </div>
          )}

          {locationHref && (
            <a
              href={locationHref}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-0 bottom-1 flex flex-col items-center gap-1"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-lime text-on-accent">
                <MapPin className="size-4" strokeWidth={2.2} />
              </span>
              <span className="text-[10px] leading-none text-mute">Location</span>
            </a>
          )}
        </div>

        <h1 className="mt-3 text-center text-[22px] leading-tight font-bold text-balance">
          {name}
        </h1>
        {org && (
          <p className="mt-1 text-center text-[11px] leading-4 font-medium text-lime">
            {org}
          </p>
        )}
        {role && (
          <p className="mt-2 text-center text-[13px] leading-4 font-bold tracking-[0.02em]">
            {role}
          </p>
        )}

        {/* Four across, two down, each a filled circle with its name under it. */}
        <ul className="mt-5 grid grid-cols-4 gap-y-4">
          {actions.map((a) => (
            <li key={a.label} className="flex flex-col items-center gap-1.5">
              <a
                href={a.href}
                target={a.href.startsWith("http") ? "_blank" : undefined}
                rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={a.label}
                className="flex size-13 items-center justify-center rounded-full bg-lime text-on-accent transition-transform duration-[120ms] active:scale-95"
              >
                <ActionGlyph kind={a.kind} />
              </a>
              <span className="text-[10px] leading-none text-mute">{a.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-slab text-[11px] font-bold tracking-[0.04em] text-on-slab uppercase">
            <UserPlus className="size-3.5" strokeWidth={2.4} />
            {labels.addToContacts}
          </button>
          <button className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-lime text-[11px] font-bold tracking-[0.04em] text-on-accent uppercase">
            <Share2 className="size-3.5" strokeWidth={2.4} />
            {labels.share}
          </button>
        </div>

        {websiteHref && (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex h-10 items-center justify-center rounded-md bg-lime text-[11px] font-bold tracking-[0.04em] text-on-accent uppercase"
          >
            {websiteLabel}
          </a>
        )}

        {about && (
          <>
            <div className="mt-8 flex items-center gap-3">
              <span className="h-px flex-1 bg-ink/12" aria-hidden />
              <Link2 className="size-4 text-mute" />
              <span className="h-px flex-1 bg-ink/12" aria-hidden />
            </div>

            <h2 className="mt-5 text-center text-[19px] leading-tight font-bold text-balance">
              {about.title}
            </h2>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-mute">
              {about.body}
            </p>

            {about.logo && (
              <div className="mt-5 flex items-center justify-center gap-2.5">
                {about.logo}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
