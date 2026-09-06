"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Smartphone, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import ProfileMockup, { type MockupProfile } from "./ProfileMockup";
import ThemeSwatch from "./ThemeSwatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chooseTheme } from "@/app/(cabinet)/[locale]/cabinet/[handle]/theme/actions";
import { PROFILE_THEMES } from "@/lib/profile/theme";
import { FAMILIES, THEMES, type ThemeFamily } from "@/lib/cabinet/themes";

// The profile theme picker: lets the owner choose how their web profile
// renders when someone touches the NFC card or opens flex.uz/:handle.
//
// Shows a large, live phone viewport preview populated with the user's
// actual avatar, name, bio, and links.
export default function ThemePicker({
  raqam,
  current,
  profile,
}: {
  raqam: string;
  current: string;
  profile: MockupProfile;
}) {
  const t = useTranslations("cabinet.theme");
  const [picked, setPicked] = useState(current);
  const [savedTheme, setSavedTheme] = useState(current);
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
      if (result === "ok") {
        setSavedTheme(picked);
        toast.success(t("saved"));
      } else {
        toast.error(t("notSaved"));
      }
    });

  return (
    <div className="flex flex-col lg:flex-row-reverse lg:items-start lg:gap-8">
      {/* Live Spotlight Preview Viewport (Large & Sticky on Desktop) */}
      <div className="mb-8 w-full shrink-0 lg:sticky lg:top-6 lg:mb-0 lg:w-[410px]">
        <div className="relative overflow-hidden rounded-tile border border-border bg-card/85 p-4 sm:p-6 shadow-slab backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Jonli profil ko'rinishi
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
              <Smartphone className="size-3.5 text-primary" />
              <span>{activeProfileTheme.name}</span>
            </div>
          </div>

          {/* Large Phone Viewport with Real User Details */}
          <div className="mx-auto drop-shadow-2xl transition-all duration-300">
            <ProfileMockup
              theme={activeProfileTheme}
              profile={profile}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            <span>Kartani tekkizganda yoki link ochilganda shu mavzu ko'rinadi</span>
          </div>
        </div>
      </div>

      {/* Catalogue & Filters Column */}
      <div className="flex flex-1 flex-col gap-6 min-w-0">
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
                name={profile.ism || profile.raqam}
                raqam={raqam}
                selected={th.id === picked}
                onSelect={() => setPicked(th.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Save Action */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 shadow-sheet backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tanlangan mavzu:</span>
            <span className="font-semibold text-foreground">{activeProfileTheme.name}</span>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={save}
            disabled={pending || picked === savedTheme}
            className="h-12 w-full sm:w-auto sm:min-w-[200px] text-base font-semibold shadow-glow ml-auto"
          >
            {picked === savedTheme ? t("inUse") : pending ? t("saving") : t("use")}
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
