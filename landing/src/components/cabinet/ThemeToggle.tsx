"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// Zero-dependency, zero-flash Theme Toggle for Cabinet.
//
// Smoothly switches between Luxury Dark and Clean Light modes,
// persisting the choice in both localStorage and cookies.
export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("flex-theme", "dark");
        document.cookie = "flex-theme=dark; path=/; max-age=31536000; SameSite=Lax";
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("flex-theme", "light");
        document.cookie = "flex-theme=light; path=/; max-age=31536000; SameSite=Lax";
      } catch {}
    }
  }

  if (!mounted) {
    return (
      <span className="flex size-9 items-center justify-center rounded-lg text-muted-foreground" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Yorug' rejim" : "Qorong'i rejim"}
      title={dark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {dark ? (
        <Sun className="size-4 text-amber-300 transition-transform hover:rotate-45" strokeWidth={2} />
      ) : (
        <Moon className="size-4 text-slate-700 transition-transform hover:-rotate-12" strokeWidth={2} />
      )}
    </button>
  );
}
