import type { CSSProperties } from "react";

// The visual theme the web profile opens in when a visitor taps the card
// or navigates to /:handle.
//
// Nine CSS properties govern the profile. Each theme provides its own
// curated ground, elevated surfaces, line borders, typographic contrast,
// and loud accent button colors.
export type ProfileTheme = {
  id: string;
  name: string;
  description: string;
  accentName: string;
  style: CSSProperties;
};

const GENESIS: ProfileTheme = {
  id: "genesis",
  name: "Genesis",
  description: "Chuqur obsidian qora fon, nafis yashirin kartalar va yorqin lime urg'ulari.",
  accentName: "Lime",
  style: {
    "--p-ground": "#0e0a1b",
    "--p-surface": "#16122a",
    "--p-surface-2": "#1f1a36",
    "--p-line": "#2b2644",
    "--p-text": "#fafaf8",
    "--p-text-2": "#b3afc2",
    "--p-text-3": "#7f7b92",
    "--p-accent": "#abff09",
    "--p-on-accent": "#0e0a1b",
  } as CSSProperties,
};

const LIME: ProfileTheme = {
  id: "lime",
  name: "Lime",
  description: "To'liq neon lime dinamikasi va kuchli zamonaviy energiya.",
  accentName: "Lime",
  style: {
    "--p-ground": "#0c0f08",
    "--p-surface": "#141d0c",
    "--p-surface-2": "#1c2811",
    "--p-line": "#2e401c",
    "--p-text": "#f6fcee",
    "--p-text-2": "#b8cfa6",
    "--p-text-3": "#7e966b",
    "--p-accent": "#abff09",
    "--p-on-accent": "#0e0a1b",
  } as CSSProperties,
};

const GRID: ProfileTheme = {
  id: "grid",
  name: "Grid",
  description: "Muhandislik to'ri, aniq texnik chiziqlar va aniq kontrast.",
  accentName: "Po'lat",
  style: {
    "--p-ground": "#111215",
    "--p-surface": "#191b20",
    "--p-surface-2": "#22252c",
    "--p-line": "#2f333d",
    "--p-text": "#f4f4f6",
    "--p-text-2": "#a1a1aa",
    "--p-text-3": "#71717a",
    "--p-accent": "#abff09",
    "--p-on-accent": "#111215",
  } as CSSProperties,
};

const SHEEN: ProfileTheme = {
  id: "sheen",
  name: "Sheen",
  description: "Moviy-kumush metall tovlanishi, shaffof va sovuq nurli dizayn.",
  accentName: "Safir",
  style: {
    "--p-ground": "#0d131d",
    "--p-surface": "#141c2b",
    "--p-surface-2": "#1c263a",
    "--p-line": "#273650",
    "--p-text": "#ffffff",
    "--p-text-2": "#94a3b8",
    "--p-text-3": "#64748b",
    "--p-accent": "#60a5fa",
    "--p-on-accent": "#0d131d",
  } as CSSProperties,
};

const NAQSH: ProfileTheme = {
  id: "naqsh",
  name: "Naqsh",
  description: "O'zbek koshinkorlik an'anasi, qadimiy to'q binafsha tun va oltin chiziqlar.",
  accentName: "Oltin",
  style: {
    "--p-ground": "#0f0d1c",
    "--p-surface": "#18142e",
    "--p-surface-2": "#231c42",
    "--p-line": "#372b66",
    "--p-text": "#fafaf8",
    "--p-text-2": "#c4b6e2",
    "--p-text-3": "#8b7cae",
    "--p-accent": "#c9a961",
    "--p-on-accent": "#0f0d1c",
  } as CSSProperties,
};

const PAPER: ProfileTheme = {
  id: "paper",
  name: "Paper",
  description: "Oq varaq, nozik kulrang hoshiyalar va chuqur qora matn.",
  accentName: "Qora",
  style: {
    "--p-ground": "#fafaf8",
    "--p-surface": "#ffffff",
    "--p-surface-2": "#f1f0f4",
    "--p-line": "#e6e4ec",
    "--p-text": "#0e0a1b",
    "--p-text-2": "#4a465a",
    "--p-text-3": "#736f82",
    "--p-accent": "#0e0a1b",
    "--p-on-accent": "#ffffff",
  } as CSSProperties,
};

const RAHBAR: ProfileTheme = {
  id: "rahbar",
  name: "Rahbar",
  description: "Rahbarlar uchun mutlaq qora vazminlik va sayqallangan kumush metall.",
  accentName: "Kumush",
  style: {
    "--p-ground": "#0a0a0b",
    "--p-surface": "#131316",
    "--p-surface-2": "#1c1c20",
    "--p-line": "#2a2a30",
    "--p-text": "#ffffff",
    "--p-text-2": "#a1a1aa",
    "--p-text-3": "#71717a",
    "--p-accent": "#e4e4e7",
    "--p-on-accent": "#0a0a0b",
  } as CSSProperties,
};

const DEVOPS: ProfileTheme = {
  id: "devops",
  name: "DevOps",
  description: "Kiber plata va server arxitekturasi, neon zumrad va kian aksenti.",
  accentName: "Kian",
  style: {
    "--p-ground": "#080d14",
    "--p-surface": "#0e1622",
    "--p-surface-2": "#152133",
    "--p-line": "#1f3048",
    "--p-text": "#f0f6fc",
    "--p-text-2": "#8b949e",
    "--p-text-3": "#586069",
    "--p-accent": "#00ffc4",
    "--p-on-accent": "#080d14",
  } as CSSProperties,
};

const SUZANI: ProfileTheme = {
  id: "suzani",
  name: "Suzani",
  description: "Shohona to'q indigo maydon va an'anaviy zarbof oltin kashta jilosi.",
  accentName: "Zarbof",
  style: {
    "--p-ground": "#14122b",
    "--p-surface": "#1e1b42",
    "--p-surface-2": "#292558",
    "--p-line": "#393378",
    "--p-text": "#ffffff",
    "--p-text-2": "#beb9ea",
    "--p-text-3": "#8b84be",
    "--p-accent": "#d9b26a",
    "--p-on-accent": "#14122b",
  } as CSSProperties,
};

const REGISTON: ProfileTheme = {
  id: "xarita",
  name: "Xarita",
  description: "Samarqand Registonining lojuvard ko'k osmoni va oltin o'ymakorlik.",
  accentName: "Oltin",
  style: {
    "--p-ground": "#0c1a33",
    "--p-surface": "#122649",
    "--p-surface-2": "#193361",
    "--p-line": "#22447f",
    "--p-text": "#f3f6fb",
    "--p-text-2": "#9db2d0",
    "--p-text-3": "#6980a3",
    "--p-accent": "#d7b364",
    "--p-on-accent": "#0c1a33",
  } as CSSProperties,
};

export const PROFILE_THEMES: Record<string, ProfileTheme> = {
  genesis: GENESIS,
  lime: LIME,
  grid: GRID,
  sheen: SHEEN,
  naqsh: NAQSH,
  paper: PAPER,
  rahbar: RAHBAR,
  devops: DEVOPS,
  suzani: SUZANI,
  xarita: REGISTON,
};

export function themeFor(dizayn?: string): ProfileTheme {
  return (dizayn && PROFILE_THEMES[dizayn]) || GENESIS;
}
