"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import CardFace from "@/components/CardFace";
import { designAccent, type CardDesignId } from "@/lib/card-designs";
import type { ThemeEntry } from "@/lib/cabinet/themes";

// A card design swatch rendered with the exact physical CardFace.
//
// Shows the authentic artwork, NFC contactless mark, custom textures,
// and poetic heritage story from the Flex catalogue.
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
  const tCat = useTranslations("catalogue");
  const accent = designAccent(theme.id as CardDesignId);

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
      {/* Physical NFC Card rendering */}
      <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-input transition-transform duration-200 group-hover:scale-[1.015]">
        <CardFace
          design={theme.id as CardDesignId}
          handle={name}
          sizes="(min-width: 640px) 340px, 92vw"
        />

        {selected && (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-slab">
            <Check aria-hidden className="size-3" strokeWidth={3} />
            Tanlangan
          </span>
        )}
      </div>

      {/* Card Info & Heritage description */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {theme.name}
          </span>
          <span className="rounded-plate border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {tCat(`accents.${accent}`)}
          </span>
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {tCat(`designs.${theme.id}`)}
        </p>
      </div>
    </button>
  );
}
