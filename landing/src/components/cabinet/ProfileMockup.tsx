"use client";

import {
  Check,
  Globe,
  Mail,
  MapPin,
  Nfc,
  Phone,
  Send,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import type { ProfileTheme } from "@/lib/profile/theme";
import { imageSrc } from "@/lib/profile/links";

export type MockupProfile = {
  raqam: string;
  ism?: string;
  lavozim?: string;
  kompaniya?: string;
  shahar?: string;
  bio?: string;
  rasm?: string;
  banner?: string;
  telefon?: string;
  email?: string;
  havolalar?: Array<{ label: string; href: string; kind?: string }> | null;
  xizmatlar?: Array<{ name: string; price: string }> | null;
  teglar?: string[] | null;
  tarif?: string;
};

// Realistic mobile viewport preview of the web profile that opens when
// someone taps an NFC device or opens the URL flex.uz/[handle].
//
// Shows the owner's actual uploaded face, name, bio, contacts and links
// dressed in the selected profile theme so they see their own card live.
export default function ProfileMockup({
  theme,
  profile,
}: {
  theme: ProfileTheme;
  profile: MockupProfile;
}) {
  const name = profile.ism || profile.raqam;
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "FL";

  const role = [profile.lavozim, profile.kompaniya].filter(Boolean).join(" · ");
  const avatar = imageSrc(profile.rasm);
  const links = profile.havolalar ?? [];
  const services = profile.xizmatlar ?? [];
  const tags = profile.teglar ?? [];

  return (
    <div
      style={theme.style}
      className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-[2.8rem] border-[7px] border-border/90 bg-[var(--p-ground)] p-5 shadow-2xl transition-all duration-300"
    >
      {/* Themed Ambient Pattern Backdrop */}
      {theme.patternStyle && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-75 transition-opacity duration-500"
          style={theme.patternStyle}
        />
      )}

      <div className="relative z-10 flex flex-col">
        {/* Mobile Dynamic Island / Speaker */}
        <div className="mx-auto mb-3 flex h-4 w-28 items-center justify-center rounded-full bg-black/50 shadow-inner">
          <span className="size-2 rounded-full bg-black/90" />
        </div>

        {/* Mini Browser Address Bar */}
        <div className="mb-4 flex items-center justify-between rounded-full bg-[var(--p-surface)]/85 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-[var(--p-text-2)]">
            <Globe className="size-3 text-[var(--p-accent)]" />
            <span>flex.uz/{profile.raqam}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--p-accent)]">
            <Nfc className="size-3 animate-pulse" />
            <span>NFC</span>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={name}
                className="size-22 rounded-full object-cover ring-3 ring-[var(--p-accent)] shadow-xl"
              />
            ) : (
              <div className="flex size-22 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-2xl font-bold text-[var(--p-text)] ring-2 ring-[var(--p-line)] shadow-md">
                {initials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)] shadow-sm">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-[var(--p-text)]">
            {name}
          </h3>

          {role && (
            <p className="mt-1 text-xs font-medium text-[var(--p-text-2)]">
              {role}
            </p>
          )}

          {profile.shahar && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--p-text-3)]">
              <MapPin className="size-3" />
              {profile.shahar}
            </p>
          )}

          {profile.bio && (
            <p className="mt-2 text-center text-xs leading-relaxed text-[var(--p-text-2)]">
              {profile.bio}
            </p>
          )}

          {/* Engraved Number Plate */}
          <div className="mt-3 rounded-plate bg-[var(--p-surface)] px-4 py-1 font-mono text-xs font-bold tracking-[0.22em] text-[var(--p-accent)] shadow-inner">
            {profile.raqam}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-4">
          <button
            type="button"
            tabIndex={-1}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-input bg-[var(--p-accent)] text-xs font-bold text-[var(--p-on-accent)] shadow-lg transition-transform active:scale-95"
          >
            <User className="size-4" strokeWidth={2.5} />
            Kontaktni saqlash
          </button>
        </div>

        {/* Quick Contact Actions */}
        <div className="mt-3 flex flex-col gap-2">
          {profile.telefon ? (
            <div className="flex items-center gap-3 rounded-input bg-[var(--p-surface)] px-3 py-2.5 text-xs font-medium text-[var(--p-text)] shadow-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-[var(--p-accent)]">
                <Phone className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 truncate">
                <span className="block text-[10px] text-[var(--p-text-3)]">
                  Qo'ng'iroq
                </span>
                <span className="font-mono text-xs">{profile.telefon}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-input bg-[var(--p-surface)] px-2.5 py-2 text-[11px] font-medium text-[var(--p-text)]">
                <span className="flex size-6 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-[var(--p-accent)]">
                  <Phone className="size-3" />
                </span>
                <span className="truncate">Qo'ng'iroq</span>
              </div>
              <div className="flex items-center gap-2 rounded-input bg-[var(--p-surface)] px-2.5 py-2 text-[11px] font-medium text-[var(--p-text)]">
                <span className="flex size-6 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-[var(--p-accent)]">
                  <Send className="size-3" />
                </span>
                <span className="truncate">Telegram</span>
              </div>
            </div>
          )}

          {profile.email && (
            <div className="flex items-center gap-3 rounded-input bg-[var(--p-surface)] px-3 py-2 text-xs font-medium text-[var(--p-text)] shadow-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-[var(--p-accent)]">
                <Mail className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 truncate">
                <span className="block text-[10px] text-[var(--p-text-3)]">
                  Email
                </span>
                <span className="truncate text-xs">{profile.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Real Links or Default Demo Links */}
        <div className="mt-3 flex flex-col gap-2">
          {links.length > 0 ? (
            links.slice(0, 3).map((link, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-input bg-[var(--p-surface)] px-3 py-2.5 text-xs font-medium text-[var(--p-text)] shadow-sm"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-[var(--p-accent)]">
                    <Send className="size-3" />
                  </span>
                  <span className="truncate">{link.label}</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--p-text-3)]">
                  →
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between rounded-input bg-[var(--p-surface)] px-3 py-2 text-[11px] text-[var(--p-text)]">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-[var(--p-accent)]">
                  <Send className="size-2.5" />
                </span>
                <span>Telegram kanal</span>
              </div>
              <span className="font-mono text-[10px] text-[var(--p-text-3)]">
                flex.uz
              </span>
            </div>
          )}
        </div>

        {/* Real Services or Badge */}
        {services.length > 0 ? (
          <div className="mt-3 flex flex-col gap-1.5 rounded-input bg-[var(--p-surface)] p-2.5 text-xs">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--p-text-3)]">
              <Sparkles className="size-3 text-[var(--p-accent)]" />
              <span>Xizmatlar</span>
            </div>
            {services.slice(0, 2).map((srv, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[11px] font-medium text-[var(--p-text)]"
              >
                <span className="truncate">{srv.name}</span>
                <span className="font-mono text-[var(--p-accent)]">
                  {srv.price}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Real Tags */}
        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--p-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--p-text-2)]"
              >
                <Tag className="size-2.5 text-[var(--p-accent)]" />#{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
