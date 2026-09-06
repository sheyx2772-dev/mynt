import { MapPin } from "lucide-react";

import type { PublicProfile } from "@/lib/backend/profile";
import { imageSrc } from "@/lib/profile/links";

// The face, the name, the number. Everything else on the page is detail.
//
// Big and centred because of where it is read: somebody has just touched two
// phones together and is holding one at arm's length to see who they met. The
// picture is the answer to that, so it gets the top of the screen rather than a
// thumbnail beside a heading.

function Initials({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <span className="flex size-28 items-center justify-center rounded-full bg-[var(--p-surface-2)] font-mono text-3xl font-semibold text-[var(--p-text-2)]">
      {initials}
    </span>
  );
}

export default function ProfileHeader({
  profile,
  numberLabel,
}: {
  profile: PublicProfile;
  numberLabel: string;
}) {
  const avatar = imageSrc(profile.rasm);
  const role = [profile.lavozim, profile.kompaniya].filter(Boolean).join(" · ");

  return (
    <header className="flex flex-col items-center px-2 text-center">
      {avatar ? (
        // Not next/image: one picture, already sized by the uploader, on our
        // own object store. A loader for it would be a round trip to save a
        // round trip.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={profile.ism}
          width={112}
          height={112}
          className="size-28 rounded-full object-cover ring-1 ring-[var(--p-line)]"
        />
      ) : (
        <Initials name={profile.ism} />
      )}

      <h1 className="mt-5 text-[28px] leading-8 font-semibold tracking-tight text-balance text-[var(--p-text)]">
        {profile.ism}
      </h1>

      {role && (
        <p className="mt-1.5 text-[15px] leading-5 text-pretty text-[var(--p-text-2)]">
          {role}
        </p>
      )}

      {profile.shahar && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--p-text-3)]">
          <MapPin aria-hidden className="size-3.5" strokeWidth={1.75} />
          {profile.shahar}
        </p>
      )}

      {/* The plate. This is the product — the thing engraved on the card in the
          reader's hand — so it is stamped under the name rather than left in
          the address bar. */}
      <p className="mt-5 rounded-plate bg-[var(--p-surface)] px-3.5 py-1.5 font-mono text-sm font-semibold tracking-[0.22em] text-[var(--p-accent)]">
        <span className="sr-only">{numberLabel}: </span>
        {profile.raqam}
      </p>
    </header>
  );
}
