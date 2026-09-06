"use client";

import { useState, type ReactNode } from "react";
import { Sparkles, Calendar, MapPin, Tag } from "lucide-react";
import type { PublicProfile } from "@/lib/backend/profile";

export default function ProfileTabsView({
  profile,
  children,
}: {
  profile: PublicProfile;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<"main" | "posts" | "about">("main");

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-[var(--p-line)] pb-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setTab("main")}
          className={`flex-1 pb-2.5 text-center transition-all ${
            tab === "main"
              ? "border-b-2 border-[var(--p-accent)] text-[var(--p-text)]"
              : "text-[var(--p-text-3)] hover:text-[var(--p-text-2)]"
          }`}
        >
          Asosiy
        </button>
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`flex-1 pb-2.5 text-center transition-all ${
            tab === "posts"
              ? "border-b-2 border-[var(--p-accent)] text-[var(--p-text)]"
              : "text-[var(--p-text-3)] hover:text-[var(--p-text-2)]"
          }`}
        >
          Postlar
        </button>
        <button
          type="button"
          onClick={() => setTab("about")}
          className={`flex-1 pb-2.5 text-center transition-all ${
            tab === "about"
              ? "border-b-2 border-[var(--p-accent)] text-[var(--p-text)]"
              : "text-[var(--p-text-3)] hover:text-[var(--p-text-2)]"
          }`}
        >
          Haqida
        </button>
      </div>

      {/* Tab Content */}
      {tab === "main" && <div className="flex flex-col gap-6">{children}</div>}

      {tab === "posts" && (
        <div className="flex flex-col items-center justify-center rounded-tile bg-[var(--p-surface)] px-6 py-12 text-center shadow-sm">
          <Sparkles className="size-8 text-[var(--p-accent)] opacity-60" />
          <h4 className="mt-3 text-base font-semibold text-[var(--p-text)]">
            Hozircha postlar yo'q
          </h4>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            Foydalanuvchi o'z devorida yangiliklarni ulashganda bu yerda ko'rinadi.
          </p>
        </div>
      )}

      {tab === "about" && (
        <div className="flex flex-col gap-4 rounded-tile bg-[var(--p-surface)] p-5 text-sm shadow-sm">
          {profile.tavsif && (
            <div>
              <span className="cap text-xs text-[var(--p-text-3)]">Biografiya</span>
              <p className="mt-1 leading-relaxed text-[var(--p-text)]">
                {profile.tavsif}
              </p>
            </div>
          )}

          {profile.shahar && (
            <div className="flex items-center gap-2 text-xs text-[var(--p-text-2)]">
              <MapPin className="size-4 text-[var(--p-accent)]" />
              <span>{profile.shahar}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[var(--p-text-2)]">
            <Calendar className="size-4 text-[var(--p-accent)]" />
            <span>FLEX ID: {profile.raqam}</span>
          </div>

          {profile.teglar && profile.teglar.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.teglar.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--p-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--p-text-2)]"
                >
                  <Tag className="size-3 text-[var(--p-accent)]" />#{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
