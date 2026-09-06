import { Check } from "lucide-react";

import type { ThemeEntry } from "@/lib/cabinet/themes";

// A theme, small enough to sit twelve to a screen.
//
// A miniature of the profile's top — ground, a surface, a plate in the accent
// — rather than a colour chip, because the owner is choosing a page, not a
// paint. The three variables it sets are the same three the real theme sets,
// so what the swatch shows is what the page will do.
export default function ThemeSwatch({
  theme,
  selected,
  onSelect,
  name,
}: {
  theme: ThemeEntry;
  selected: boolean;
  onSelect: () => void;
  name: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col gap-2 rounded-card border-2 p-1.5 text-left transition-colors ${
        selected
          ? "border-foreground"
          : "border-transparent hover:border-border"
      }`}
    >
      <span
        style={theme.swatch}
        className="relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 rounded-input bg-[var(--p-ground)] p-2"
      >
        <span className="size-7 rounded-full bg-[var(--p-surface)] ring-1 ring-[var(--p-accent)]" />
        <span className="max-w-full truncate text-[9px] font-medium text-[var(--p-text)]">
          {name}
        </span>
        <span className="rounded-plate bg-[var(--p-surface)] px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.18em] text-[var(--p-accent)]">
          AAA777
        </span>
        {selected && (
          <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden className="size-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="px-1 pb-0.5 text-xs font-medium">{theme.name}</span>
    </button>
  );
}
