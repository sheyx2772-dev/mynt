"use client";

import { Check, Globe, MapPin, Nfc, Phone, Send, User } from "lucide-react";
import type { ProfileTheme } from "@/lib/profile/theme";

// Realistic mobile viewport preview of the web profile that opens when
// someone taps an NFC device or opens the URL flex.uz/[handle].
export default function ProfileMockup({
  theme,
  raqam,
  name,
}: {
  theme: ProfileTheme;
  raqam: string;
  name: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "FL";

  return (
    <div
      style={theme.style}
      className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[2.2rem] border-[4px] border-border/80 bg-[var(--p-ground)] p-4 shadow-2xl transition-colors duration-300"
    >
      {/* Mobile Top Speaker & Dynamic Island */}
      <div className="mx-auto mb-3 flex h-4 w-28 items-center justify-center rounded-full bg-black/40">
        <span className="size-2 rounded-full bg-black/80" />
      </div>

      {/* Mini Browser Bar */}
      <div className="mb-4 flex items-center justify-between rounded-full bg-[var(--p-surface)]/80 px-3 py-1.5 backdrop-blur">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--p-text-2)]">
          <Globe className="size-3 text-[var(--p-accent)]" />
          <span>flex.uz/{raqam}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-[var(--p-accent)]">
          <Nfc className="size-3 animate-pulse" />
          <span>NFC</span>
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-2.5 flex size-18 items-center justify-center rounded-full bg-[var(--p-surface-2)] text-xl font-bold text-[var(--p-text)] ring-2 ring-[var(--p-line)] shadow-md">
          {initials}
          <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)]">
            <Check className="size-3" strokeWidth={3} />
          </span>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-[var(--p-text)]">
          {name}
        </h3>
        <p className="mt-0.5 text-xs text-[var(--p-text-2)]">
          Kompaniya rahbari · Toshkent
        </p>

        {/* Number Plate */}
        <div className="mt-2.5 rounded-plate bg-[var(--p-surface)] px-3 py-1 font-mono text-xs font-bold tracking-[0.2em] text-[var(--p-accent)] shadow-inner">
          {raqam}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mt-4">
        <button
          type="button"
          tabIndex={-1}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-input bg-[var(--p-accent)] text-xs font-bold text-[var(--p-on-accent)] shadow-md"
        >
          <User className="size-3.5" strokeWidth={2.5} />
          Kontaktni saqlash
        </button>
      </div>

      {/* Quick Contacts Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2">
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

      {/* Mock Services / Bio Item */}
      <div className="mt-3 rounded-input bg-[var(--p-surface)] p-2.5 text-[11px]">
        <div className="flex items-center justify-between text-[var(--p-text-3)]">
          <span className="cap">Asosiy xizmat</span>
          <span className="font-mono text-[var(--p-accent)]">FLEX ID</span>
        </div>
        <p className="mt-1 font-medium text-[var(--p-text)]">
          Raqamli NFC vizitka va xizmatlar
        </p>
      </div>
    </div>
  );
}
