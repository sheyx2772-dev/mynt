import { Check, Crown, MapPin, Sparkles } from "lucide-react";

import type { PublicProfile } from "@/lib/backend/profile";
import { imageSrc } from "@/lib/profile/links";
import ProfileInteractions from "./ProfileInteractions";

function Initials({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <span className="flex size-24 items-center justify-center rounded-full bg-[var(--p-surface-2)] font-mono text-3xl font-semibold text-[var(--p-text-2)]">
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
  const banner = imageSrc(profile.banner);
  const role = [profile.lavozim, profile.kompaniya].filter(Boolean).join(" · ");

  return (
    <header className="relative flex flex-col items-center text-center">
      {/* Cover Banner Header */}
      <div className="relative -mx-5 -mt-10 h-36 w-[calc(100%+2.5rem)] overflow-hidden rounded-b-3xl bg-gradient-to-b from-[var(--p-surface-2)] via-[var(--p-surface)] to-[var(--p-ground)] sm:h-44">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt={profile.ism}
            className="size-full object-cover opacity-90"
          />
        ) : (
          <div className="relative size-full opacity-60">
            {/* Atmospheric mountain twilight silhouette fallback */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--p-ground)] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[radial-gradient(ellipse_at_center,_var(--p-accent)_0%,_transparent_70%)] opacity-30" />
          </div>
        )}
      </div>

      {/* Avatar with Glowing Halo Ring */}
      <div className="relative -mt-14 mb-3.5 flex items-center justify-center">
        <div className="rounded-full bg-[var(--p-ground)] p-1 ring-3 ring-[var(--p-accent)] shadow-[0_0_25px_var(--p-accent)] transition-all">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={profile.ism}
              width={96}
              height={96}
              className="size-24 rounded-full object-cover"
            />
          ) : (
            <Initials name={profile.ism} />
          )}
        </div>
      </div>

      {/* Name and Badges */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-2">
        <span className="text-[var(--p-accent)]">✦</span>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--p-text)]">
          {profile.ism}
        </h1>
        <span className="text-[var(--p-accent)]">✦</span>

        {/* Verified Checkmark Badge */}
        <span
          title="Tasdiqlangan profil"
          className="inline-flex size-4.5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>

        {/* Crown Badge */}
        <Crown className="size-4 text-amber-400 drop-shadow" />

        {/* Glowing Flex Gold Tag */}
        <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-[var(--p-accent)]/50 bg-[var(--p-surface)] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[var(--p-accent)] shadow-[0_0_10px_var(--p-accent)]">
          <Sparkles className="size-2.5" /> FLEX GOLD
        </span>
      </div>

      {role && (
        <p className="mt-1 text-sm font-medium text-[var(--p-text-2)]">
          {role}
        </p>
      )}

      {profile.shahar && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--p-text-3)]">
          <MapPin aria-hidden className="size-3" strokeWidth={2} />
          {profile.shahar}
        </p>
      )}

      {/* The Plate Number */}
      <div className="mt-3 mb-5 rounded-plate bg-[var(--p-surface)] px-3.5 py-1 font-mono text-xs font-bold tracking-[0.2em] text-[var(--p-accent)] shadow-inner">
        <span className="sr-only">{numberLabel}: </span>
        {profile.raqam} · Gold Premium
      </div>

      {/* Interactive Follow, Reactions, and Stats */}
      <ProfileInteractions
        followersCount={profile.obunachilar}
        viewsCount={profile.korishlar}
        raqam={profile.raqam}
      />
    </header>
  );
}
