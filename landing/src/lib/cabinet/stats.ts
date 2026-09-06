import "server-only";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";
import { normalize } from "./handles";

// How the number did: views, taps on links, and where the views came from.
//
// The backend keeps no record of who looked — a daily-salted hash counts
// distinct phones without keeping a phone — so what arrives here is sums and
// nothing else, and that is what the page shows.

type Raw = components["schemas"]["Report"];

/** The backend's report with its lists flattened: null-when-empty, once, here. */
export type Report = Omit<Raw, "kunlar" | "havolalar" | "manbalar"> & {
  kunlar: components["schemas"]["Day"][];
  havolalar: components["schemas"]["LinkStat"][];
  manbalar: components["schemas"]["SourceStat"][];
};

/** The windows the page offers. Anything else is clamped by the backend. */
export const WINDOWS = [7, 30, 90] as const;
export type Window = (typeof WINDOWS)[number];

export function windowOf(raw: string | undefined): Window {
  const n = Number(raw);
  return (WINDOWS as readonly number[]).includes(n) ? (n as Window) : 30;
}

const EMPTY: Report = {
  kunlar: [],
  havolalar: [],
  manbalar: [],
  jami_korishlar: 0,
  jami_bosishlar: 0,
  jami_tashrifchilar_kunlik: 0,
};

export async function report(raw: string, days: Window): Promise<Report> {
  const raqam = normalize(raw);
  if (!raqam) return EMPTY;
  const { api } = await asReader();
  const { data, error } = await api.GET("/raqamlar/{raqam}/statistika", {
    params: { path: { raqam }, query: { kun: days } },
  });
  if (error || !data) return EMPTY;
  const r = data.hisobot;
  return {
    ...r,
    kunlar: r.kunlar ?? [],
    havolalar: r.havolalar ?? [],
    manbalar: r.manbalar ?? [],
  };
}
