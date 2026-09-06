"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { initials } from "@/lib/cabinet/format";
import { imageSrc } from "@/lib/profile/links";

// What a stranger sees, drawn twice: with the door open and with it shut.
//
// Two columns rather than one that flips, because the question the owner is
// answering is a comparison — what goes behind the lock — and a comparison
// wants both sides on screen. The column the switch currently selects is
// outlined; the other is what they would get by flipping it. The rows are
// this profile's own: an owner with no services listed does not see a
// "services" row go dark, because there is nothing there to hide.
export type PreviewProfile = {
  name: string;
  avatar?: string;
  role: string;
  hasBio: boolean;
  links: number;
  services: number;
};

export default function StrangerPreview({
  closed,
  profile,
}: {
  closed: boolean;
  profile: PreviewProfile;
}) {
  const t = useTranslations("cabinet.privacy");
  const avatar = imageSrc(profile.avatar);

  const hidden = [
    profile.role && { key: "role", text: profile.role },
    profile.hasBio && { key: "bio", text: t("row.bio") },
    profile.links > 0 && {
      key: "links",
      text: t("row.links", { count: profile.links }),
    },
    profile.services > 0 && {
      key: "services",
      text: t("row.services", { count: profile.services }),
    },
    { key: "posts", text: t("row.posts") },
  ].filter((r): r is { key: string; text: string } => Boolean(r));

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Column
        shut={false}
        closed={closed}
        profile={profile}
        hidden={hidden}
        avatar={avatar}
      />
      <Column
        shut
        closed={closed}
        profile={profile}
        hidden={hidden}
        avatar={avatar}
      />
    </div>
  );
}

// One column: the profile as a stranger meets it, door open or shut.
function Column({
  shut,
  closed,
  profile,
  hidden,
  avatar,
}: {
  shut: boolean;
  closed: boolean;
  profile: PreviewProfile;
  hidden: { key: string; text: string }[];
  avatar: string | null;
}) {
  const t = useTranslations("cabinet.privacy");
  const active = shut === closed;
  return (
    <div
      aria-current={active ? "true" : undefined}
      className={`flex flex-col gap-2 rounded-input border p-3 transition-colors ${
        active ? "border-foreground bg-muted" : "border-border opacity-60"
      }`}
    >
      <p className="cap text-muted-foreground">
        {shut ? t("whenClosed") : t("whenOpen")}
      </p>

      {/* Always shown, in both columns: the face, the name, the number. */}
      <div className="flex items-center gap-2">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-secondary font-mono text-[10px] font-semibold">
            {initials(profile.name)}
          </span>
        )}
        <span className="truncate text-xs font-medium">{profile.name}</span>
      </div>

      {hidden.map((row) => (
        <p
          key={row.key}
          className={`flex items-center gap-1.5 truncate text-xs ${
            shut
              ? "text-muted-foreground line-through decoration-muted-foreground/60"
              : ""
          }`}
        >
          {shut && (
            <Lock aria-hidden className="size-3 shrink-0" strokeWidth={2} />
          )}
          <span className="truncate">{row.text}</span>
        </p>
      ))}

      {shut && (
        <p className="mt-1 rounded-plate bg-primary px-2 py-1 text-center text-[11px] leading-4 font-medium text-primary-foreground">
          {t("askButton")}
        </p>
      )}
    </div>
  );
}
