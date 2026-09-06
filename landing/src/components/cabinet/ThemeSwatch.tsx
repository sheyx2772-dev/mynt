"use client";

import { Check, Globe, Nfc } from "lucide-react";

import { PROFILE_THEMES } from "@/lib/profile/theme";
import type { ThemeEntry } from "@/lib/cabinet/themes";

// A profile theme swatch rendered as a miniature smartphone web profile.
//
// Shows the exact palette a visitor sees when tapping the NFC card or opening
// the URL: ground color, surface cards, typography, and call-to-action button.
export default function ThemeSwatch({
  theme,
  selected,
  onSelect,
  name,
  raqam,
}: {
  theme: ThemeEntry;
  selected: boolean;
  onSelect: () => void;
  name: string;
  raqam: string;
}) {
  const profileTheme = PROFILE_THEMES[theme.id] || PROFILE_THEMES.genesis;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "FL";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex flex-col rounded-card border text-left transition-all duration-200 ${
        selected
          ? "border-primary bg-card shadow-[0_0_24px_-4px_rgba(171,255,9,0.3)] ring-2 ring-primary"
          : "border-border/80 bg-card/60 hover:border-border hover:bg-card hover:shadow-card"
      } p-3 sm:p-3.5`}
    >
      {/* Web Profile Phone Preview Card */}
      <div
        style={profileTheme.style}
        className="relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-input bg-[var(--p-ground)] p-3 text-[var(--p-text)] shadow-inner transition-transform duration-200 group-hover:scale-[1.015]"
      >
        {/* Top URL / NFC Bar */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono text-[9px] text-[var(--p-text-2)]">
            <Globe className="size-2.5 text-[var(--p-accent)]" />
            flex.uz/{raqam}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[var(--p-surface)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--p-accent)]">
            <Nfc className="size-2.5" />
            Web Profil
          </span>
        </div>

        {/* Center: Avatar & Info */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-xs font-bold text-[var(--p-text)] ring-1 ring-[var(--p-line)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[var(--p-text)]">
              {name}
            </p>
            <div className="mt-0.5 inline-block rounded-plate bg-[var(--p-surface)] px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-[var(--p-accent)]">
              {raqam}
            </div>
          </div>
        </div>

        {/* Bottom Contact Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex h-5.5 flex-1 items-center justify-center rounded-input bg-[var(--p-accent)] text-[9px] font-bold text-[var(--p-on-accent)]">
            Kontaktni saqlash
          </div>
          <div className="flex size-5.5 shrink-0 items-center justify-center rounded-input bg-[var(--p-surface)] text-[9px] text-[var(--p-text-2)]">
            •••
          </div>
        </div>

        {/* Selected badge overlay */}
        {selected && (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-slab">
            <Check aria-hidden className="size-2.5" strokeWidth={3} />
            Tanlangan
          </span>
        )}
      </div>

      {/* Theme Info & Accent */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {profileTheme.name}
          </span>
          <span className="rounded-plate border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {profileTheme.accentName}
          </span>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {profileTheme.description}
        </p>
      </div>
    </button>
  );
}
