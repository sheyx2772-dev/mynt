"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import ProfileMockup from "./ProfileMockup";
import ThemeSwatch from "./ThemeSwatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chooseTheme } from "@/app/(cabinet)/[locale]/cabinet/[handle]/theme/actions";
import { PROFILE_THEMES } from "@/lib/profile/theme";
import { FAMILIES, THEMES, type ThemeFamily } from "@/lib/cabinet/themes";

// The profile theme picker: lets the owner choose how their web profile
// renders when someone touches the NFC card or opens flex.uz/:handle.
//
// Shows a live phone viewport so changes can be evaluated on the exact
// form factor visitors use in the browser.
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

  const activeProfileTheme = useMemo(
    () => PROFILE_THEMES[picked] || PROFILE_THEMES.genesis,
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
      {/* Live Spotlight Preview of the Web Profile */}
      <div className="relative overflow-hidden rounded-tile border border-border bg-card/70 p-4 sm:p-6 shadow-slab backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Veb-profil ko'rinishi (NFC / URL)
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">
            <Smartphone className="size-3.5 text-primary" />
            <span>{activeProfileTheme.name}</span>
          </div>
        </div>

        <div className="mx-auto max-w-sm drop-shadow-2xl transition-all duration-300">
          <ProfileMockup
            theme={activeProfileTheme}
            raqam={raqam}
            name={name}
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
              raqam={raqam}
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
