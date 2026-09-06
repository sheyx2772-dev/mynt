import "server-only";

import { asReader, backend } from "@/lib/backend/client";

// What the owner is told about their profile.
//
// The visitor is not identified here any more and never should have been in
// two places: the backend salts an address with the day and keeps the digest,
// so two visits from one phone on one day are one visitor and the same phone
// tomorrow is a row nobody can join back. This file no longer sees an address
// at all — it forwards the request and the backend reads its own headers.

const SOURCES = ["nfc", "qr", "share"] as const;
export type VisitSource = (typeof SOURCES)[number];

/**
 * The `src` parameter, kept only when it is one of ours.
 *
 * It lives in a link anyone can edit, so an unrecognised value is dropped
 * rather than stored — otherwise the owner's breakdown is whatever a passer-by
 * decided to type.
 */
export function readSource(raw: string | undefined): VisitSource | null {
  return SOURCES.includes(raw as VisitSource) ? (raw as VisitSource) : null;
}

/** Recorded on the way past. Never awaited by a page: nobody waits to be counted. */
export async function recordProfileView(handle: string, source: VisitSource | null): Promise<void> {
  await backend
    .POST("/profil/{raqam}/tashrif", {
      params: { path: { raqam: handle } },
      body: { manba: source ?? undefined },
    })
    .catch(() => {});
}

export async function recordLinkClick(handle: string, label: string): Promise<void> {
  await backend
    .POST("/profil/{raqam}/tashrif", {
      params: { path: { raqam: handle } },
      body: { havola: label },
    })
    .catch(() => {});
}

export type DailyStat = { day: string; views: number; clicks: number; visitors: number };
export type LinkStat = { label: string; clicks: number };
export type SourceStat = { source: string; views: number };

export type HandleStats = {
  daily: DailyStat[];
  links: LinkStat[];
  sources: SourceStat[];
  totalViews: number;
  totalClicks: number;
  totalVisitors: number;
};

const EMPTY: HandleStats = {
  daily: [],
  links: [],
  sources: [],
  totalViews: 0,
  totalClicks: 0,
  totalVisitors: 0,
};

export async function getHandleStats(handle: string, days = 30): Promise<HandleStats> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/statistika", {
    params: { path: { raqam: handle }, query: { kun: days } },
  });
  if (error || !data?.hisobot) return EMPTY;

  const r = data.hisobot;
  return {
    daily: (r.kunlar ?? []).map((d) => ({
      day: d.kun,
      views: d.korishlar,
      clicks: d.bosishlar,
      visitors: d.tashrifchilar,
    })),
    links: (r.havolalar ?? []).map((l) => ({ label: l.havola, clicks: l.bosishlar })),
    sources: (r.manbalar ?? []).map((s) => ({ source: s.manba, views: s.korishlar })),
    totalViews: r.jami_korishlar,
    totalClicks: r.jami_bosishlar,
    totalVisitors: r.jami_tashrifchilar_kunlik,
  };
}
