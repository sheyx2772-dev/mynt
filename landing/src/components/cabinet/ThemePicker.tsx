"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import ThemeSwatch from "./ThemeSwatch";
import CardFace from "@/components/CardFace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chooseTheme } from "@/app/(cabinet)/[locale]/cabinet/[handle]/theme/actions";
import { type CardDesignId } from "@/lib/card-designs";
import { FAMILIES, THEMES, type ThemeFamily } from "@/lib/cabinet/themes";

// A luxury card catalogue with a live spotlight preview and one-touch apply.
//
// Shows the 10 authentic Flex card designs as real physical cards. The top
// spotlight shows the picked design in high resolution with container-based
// proportions, while the 2-column catalogue lets the user explore each
// piece's unique finish, accent, and heritage story.
export default function ThemePicker({
  raqam,
  current,
  name,
}: {
  raqam: string;
  current: string;
  name: string;
}) {
  const t = useTranslations("cabinet.theme");
  const [picked, setPicked] = useState(current);
  const [family, setFamily] = useState<ThemeFamily | null>(null);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  const activeTheme = useMemo(
    () => THEMES.find((th) => th.id === picked) ?? THEMES[0],
    [picked],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return THEMES.filter(
      (th) =>
        (!family || th.family === family) &&
        (!q || th.name.toLowerCase().includes(q)),
    );
  }, [family, query]);

  const save = () =>
    start(async () => {
      const result = await chooseTheme(raqam, picked);
      if (result === "ok") toast.success(t("saved"));
      else toast.error(t("notSaved"));
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Live Spotlight Preview of the selected card */}
      <div className="relative overflow-hidden rounded-tile border border-border bg-card/70 p-4 sm:p-6 shadow-slab backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("preview")}
            </span>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {activeTheme.name}
          </span>
        </div>
        <div className="mx-auto max-w-sm drop-shadow-2xl transition-all duration-300">
          <CardFace
            design={picked as CardDesignId}
            handle={name}
            sizes="(min-width: 640px) 384px, 92vw"
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-11 rounded-input pl-9 text-base"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <Chip active={family === null} onClick={() => setFamily(null)}>
            {t("all")}
          </Chip>
          {FAMILIES.map((f) => (
            <Chip key={f} active={family === f} onClick={() => setFamily(f)}>
              {t(`family.${f}`)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Catalogue Cards Grid */}
      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("nothing")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shown.map((th) => (
            <ThemeSwatch
              key={th.id}
              theme={th}
              name={name}
              selected={th.id === picked}
              onSelect={() => setPicked(th.id)}
            />
          ))}
        </div>
      )}

      {/* Sticky Bottom Save Action */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 shadow-sheet backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl">
          <Button
            type="button"
            size="lg"
            onClick={save}
            disabled={pending || picked === current}
            className="h-12 w-full text-base font-semibold shadow-glow"
          >
            {picked === current ? t("inUse") : pending ? t("saving") : t("use")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
