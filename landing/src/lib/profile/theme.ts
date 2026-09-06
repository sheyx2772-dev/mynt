import type { CSSProperties } from "react";

// The visual theme the web profile opens in when a visitor taps the card
// or navigates to /:handle.
//
// Nine CSS properties govern the profile. Each theme provides its own
// curated ground, elevated surfaces, line borders, typographic contrast,
// loud accent button colors, and rich ambient patterns/textures.
export type ProfileTheme = {
  id: string;
  name: string;
  description: string;
  accentName: string;
  style: CSSProperties;
  patternStyle?: CSSProperties;
};

const GENESIS: ProfileTheme = {
  id: "genesis",
  name: "Genesis",
  description: "Chuqur obsidian qora fon, nafis yashirin kartalar va yorqin lime urg'ulari.",
  accentName: "Lime",
  style: {
    "--p-ground": "#0b0914",
    "--p-surface": "#141026",
    "--p-surface-2": "#1d1836",
    "--p-line": "#2b244d",
    "--p-text": "#fafaf8",
    "--p-text-2": "#b3afc2",
    "--p-text-3": "#7f7b92",
    "--p-accent": "#abff09",
    "--p-on-accent": "#0b0914",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.22) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(171, 255, 9, 0.1) 0%, transparent 50%)",
  },
};

const LIME: ProfileTheme = {
  id: "lime",
  name: "Lime",
  description: "To'liq neon lime dinamikasi va kuchli zamonaviy energiya.",
  accentName: "Lime",
  style: {
    "--p-ground": "#080c05",
    "--p-surface": "#111a0a",
    "--p-surface-2": "#18250f",
    "--p-line": "#283d19",
    "--p-text": "#f6fcee",
    "--p-text-2": "#b8cfa6",
    "--p-text-3": "#7e966b",
    "--p-accent": "#abff09",
    "--p-on-accent": "#080c05",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "radial-gradient(circle at 85% 15%, rgba(171, 255, 9, 0.25) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(171, 255, 9, 0.15) 0%, transparent 55%)",
  },
};

const GRID: ProfileTheme = {
  id: "grid",
  name: "Grid",
  description: "Muhandislik to'ri, aniq texnik chiziqlar va aniq kontrast.",
  accentName: "Po'lat",
  style: {
    "--p-ground": "#0c0d10",
    "--p-surface": "#15171d",
    "--p-surface-2": "#1e2129",
    "--p-line": "#2e333f",
    "--p-text": "#f4f4f6",
    "--p-text-2": "#a1a1aa",
    "--p-text-3": "#71717a",
    "--p-accent": "#00f0ff",
    "--p-on-accent": "#0c0d10",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px)",
    backgroundSize: "26px 26px",
  },
};

const SHEEN: ProfileTheme = {
  id: "sheen",
  name: "Sheen",
  description: "Moviy-kumush metall tovlanishi, shaffof va sovuq nurli dizayn.",
  accentName: "Safir",
  style: {
    "--p-ground": "#08101a",
    "--p-surface": "#101b2c",
    "--p-surface-2": "#18273e",
    "--p-line": "#23395b",
    "--p-text": "#ffffff",
    "--p-text-2": "#94a3b8",
    "--p-text-3": "#64748b",
    "--p-accent": "#38bdf8",
    "--p-on-accent": "#08101a",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.28) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(99, 102, 241, 0.18) 0%, transparent 55%)",
  },
};

const NAQSH: ProfileTheme = {
  id: "naqsh",
  name: "Naqsh",
  description: "O'zbek koshinkorlik an'anasi, qadimiy to'q binafsha tun va oltin chiziqlar.",
  accentName: "Oltin",
  style: {
    "--p-ground": "#0a081a",
    "--p-surface": "#141030",
    "--p-surface-2": "#1d1744",
    "--p-line": "#342770",
    "--p-text": "#fafaf8",
    "--p-text-2": "#c4b6e2",
    "--p-text-3": "#8b7cae",
    "--p-accent": "#e5c158",
    "--p-on-accent": "#0a081a",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "radial-gradient(circle at 50% 10%, rgba(229, 193, 88, 0.22) 0%, transparent 60%), radial-gradient(circle, rgba(229, 193, 88, 0.12) 1.2px, transparent 1.2px)",
    backgroundSize: "100% 100%, 24px 24px",
  },
};

const PAPER: ProfileTheme = {
  id: "paper",
  name: "Paper",
  description: "Oq varaq, nozik kulrang hoshiyalar va chuqur qora matn.",
  accentName: "Qora",
  style: {
    "--p-ground": "#f7f6f2",
    "--p-surface": "#ffffff",
    "--p-surface-2": "#eceae3",
    "--p-line": "#dedbd2",
    "--p-text": "#121118",
    "--p-text-2": "#4a4658",
    "--p-text-3": "#787487",
    "--p-accent": "#121118",
    "--p-on-accent": "#ffffff",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px)",
    backgroundSize: "20px 20px",
  },
};

const RAHBAR: ProfileTheme = {
  id: "rahbar",
  name: "Rahbar",
  description: "Rahbarlar uchun mutlaq qora vazminlik va sayqallangan kumush metall.",
  accentName: "Kumush",
  style: {
    "--p-ground": "#080809",
    "--p-surface": "#111113",
    "--p-surface-2": "#19191d",
    "--p-line": "#26262c",
    "--p-text": "#ffffff",
    "--p-text-2": "#a1a1aa",
    "--p-text-3": "#71717a",
    "--p-accent": "#f3f4f6",
    "--p-on-accent": "#080809",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255, 255, 255, 0.035) 39px, rgba(255, 255, 255, 0.035) 40px), radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)",
  },
};

const DEVOPS: ProfileTheme = {
  id: "devops",
  name: "DevOps",
  description: "Kiber plata va server arxitekturasi, neon zumrad va kian aksenti.",
  accentName: "Kian",
  style: {
    "--p-ground": "#050d0a",
    "--p-surface": "#0a1712",
    "--p-surface-2": "#10241c",
    "--p-line": "#19382c",
    "--p-text": "#f0f6fc",
    "--p-text-2": "#8b949e",
    "--p-text-3": "#586069",
    "--p-accent": "#00ffc4",
    "--p-on-accent": "#050d0a",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "linear-gradient(rgba(0, 255, 196, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 196, 0.06) 1px, transparent 1px), radial-gradient(circle at 50% 0%, rgba(0, 255, 196, 0.18) 0%, transparent 65%)",
    backgroundSize: "32px 32px, 32px 32px, 100% 100%",
  },
};

const SUZANI: ProfileTheme = {
  id: "suzani",
  name: "Suzani",
  description: "Shohona to'q indigo maydon va an'anaviy zarbof oltin kashta jilosi.",
  accentName: "Zarbof",
  style: {
    "--p-ground": "#12091c",
    "--p-surface": "#1c102b",
    "--p-surface-2": "#27183b",
    "--p-line": "#3d265a",
    "--p-text": "#ffffff",
    "--p-text-2": "#beb9ea",
    "--p-text-3": "#8b84be",
    "--p-accent": "#f59e0b",
    "--p-on-accent": "#12091c",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.24) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(217, 70, 239, 0.14) 0%, transparent 50%), radial-gradient(circle, rgba(245, 158, 11, 0.1) 1.5px, transparent 1.5px)",
    backgroundSize: "100% 100%, 100% 100%, 28px 28px",
  },
};

const REGISTON: ProfileTheme = {
  id: "xarita",
  name: "Xarita",
  description: "Samarqand Registonining lojuvard ko'k osmoni va oltin o'ymakorlik.",
  accentName: "Oltin",
  style: {
    "--p-ground": "#071529",
    "--p-surface": "#0e203c",
    "--p-surface-2": "#152c52",
    "--p-line": "#1e3f73",
    "--p-text": "#f3f6fb",
    "--p-text-2": "#9db2d0",
    "--p-text-3": "#6980a3",
    "--p-accent": "#fbbf24",
    "--p-on-accent": "#071529",
  } as CSSProperties,
  patternStyle: {
    backgroundImage:
      "radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.25) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(251, 191, 36, 0.15) 0%, transparent 50%), radial-gradient(circle, rgba(14, 165, 233, 0.1) 1px, transparent 1px)",
    backgroundSize: "100% 100%, 100% 100%, 24px 24px",
  },
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
