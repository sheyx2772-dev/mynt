"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import ThemeSwatch from "./ThemeSwatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chooseTheme } from "@/app/(cabinet)/[locale]/cabinet/[handle]/theme/actions";
import { FAMILIES, THEMES, type ThemeFamily } from "@/lib/cabinet/themes";

// A catalogue with a filter, and one button.
//
// Built for thirty: a search box, a row of family chips and a grid of
// swatches that shrinks as either narrows it. Ten today fit on one screen
// without the filters doing anything, which is fine — the filters cost a row
// and save a scroll the day the eleventh arrives. Choosing is a tap; saving
// is a second, deliberate one, because the profile is public the moment it
// is saved and a mis-tap on a grid should not repaint it.
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
    <div className="flex flex-col gap-4">
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

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("nothing")}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 p-4 shadow-sheet backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl">
          <Button
            type="button"
            size="lg"
            onClick={save}
            disabled={pending || picked === current}
            className="h-12 w-full text-base"
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
