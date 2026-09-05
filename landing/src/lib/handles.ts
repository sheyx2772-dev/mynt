import { effectivePlan, type PlanId } from "@/lib/plans";
import { readServices, type Service } from "@/lib/services";
import { cache } from "react";
import { DEFAULT_CARD_DESIGN, isCardDesign, type CardDesignId } from "@/lib/card-designs";
import { DEFAULT_DEVICE_TYPE, isDeviceType, type DeviceTypeId } from "@/lib/devices";
import { asReader, backend, type Reader } from "@/lib/backend/client";
import type { paths } from "@/lib/backend/schema";

export type ClaimedProfile = {
  /** Whether the reader owns this number. */
  isOwner: boolean;
  /** What the reader has already done here. */
  isFollowing: boolean;
  isRecommended: boolean;
  name: string;
  bio: string;
  avatarUrl: string | null;
  links: { label: string; href: string; kind?: "payment" }[];
  city: string | null;
  contactEmail: string | null;
  phone: string | null;
  position: string | null;
  company: string | null;
  cardDesign: CardDesignId;
  plan: PlanId;
  services: Service[];
  bannerUrl: string | null;
  commentsOpen: boolean;
  recommendCount: number;
  /** Set when the handle belongs to a company, whose fields it then carries. */
  team: { name: string; logoUrl: string | null; website: string | null } | null;
  tags: string[];
  lastSeenAt: string | null;
  viewCount: number;
  followerCount: number;
  postCount: number;
};

export const getClaimedProfile = cache(async (normalized: string): Promise<ClaimedProfile | null> => {
  const client = await asReader();
  const { data, error } = await client.GET("/profil/{raqam}", {
    params: { path: { raqam: normalized } },
  });
  if (error || !data?.profil) return null;

  const p = data.profil;
  return {
    // The backend answers whether the reader owns this rather than saying who
    // does. The page only ever asked the first question, and the second is a
    // fact about a customer that a stranger tapping a card should not learn.
    isOwner: p.meniki,
    isFollowing: p.obunaman,
    isRecommended: p.tavsiya_qilganman,
    name: p.ism,
    bio: p.tavsif ?? "",
    avatarUrl: p.rasm ?? null,
    links: (p.havolalar ?? []) as ClaimedProfile["links"],
    city: p.shahar ?? null,
    contactEmail: p.email ?? null,
    phone: p.telefon ?? null,
    position: p.lavozim ?? null,
    company: p.kompaniya ?? null,
    cardDesign: isCardDesign(p.dizayn) ? p.dizayn : DEFAULT_CARD_DESIGN,
    plan: p.tarif as PlanId,
    services: (p.xizmatlar ?? []) as Service[],
    bannerUrl: p.banner ?? null,
    tags: p.teglar ?? [],
    lastSeenAt: p.oxirgi_faollik ?? null,
    viewCount: p.korishlar,
    // Not moved yet: comments, recommendations and follows are their own
    // slice, and each keeps its own count.
    commentsOpen: false,
    recommendCount: 0,
    team: null,
    followerCount: 0,
    postCount: 0,
  };
});

export type GenesisCard = {
  serial: string;
  status: "unsold" | "claimed";
  ownerName: string | null;
  ownerHandle: string | null;
  mintedAt: string | null;
};

export const getGenesisCard = cache(async (serial: string): Promise<GenesisCard | null> => {
  const { data, error } = await backend.GET("/karta/{seriya}", {
    params: { path: { seriya: serial } },
  });
  if (error || !data?.karta) return null;

  const c = data.karta;
  return {
    serial: c.seriya,
    status: c.holat as GenesisCard["status"],
    ownerName: c.ism ?? null,
    ownerHandle: c.raqam ?? null,
    mintedAt: c.chiqarilgan ? c.chiqarilgan.slice(0, 10) : null,
  };
});

export type PublicHandle = { normalized: string; updatedAt: string | null };

// Claimed handles, for the sitemap. Capped so the query stays bounded as the
// namespace fills up; split into a sitemap index if it ever nears the limit.
export async function listPublicHandles(): Promise<PublicHandle[]> {
  const { data, error } = await backend.GET("/rezidentlar/royxat", {});
  if (error || !data) return [];

  return (data.raqamlar ?? []).map((r) => ({
    normalized: r.raqam,
    updatedAt: r.yangilangan ?? null,
  }));
}

export type OwnedHandle = {
  normalized: string;
  status: "available" | "reserved" | "claimed";
  name: string;
  bio: string;
  avatarUrl: string | null;
  links: { label: string; href: string; kind?: "payment" }[];
  pricePaid: number | null;
  claimedAt: string | null;
  reservedUntil: string | null;
  city: string | null;
  contactEmail: string | null;
  phone: string | null;
  position: string | null;
  company: string | null;
  services: Service[];
  plan: PlanId;
  bannerUrl: string | null;
  /** The company that owns this handle, if any. Its fields are not editable. */
  teamName: string | null;
  commentsOpen: boolean;
  tags: string[];
  viewCount: number;
  cardDesign: CardDesignId;
  deviceType: DeviceTypeId;
  /** Artwork made for this handle alone, which outranks the catalogue design. */
  customDesignUrl: string | null;
};

/** The company a handle belongs to, or nothing. */
type TeamBrand = {
  name: string;
  logo_url: string | null;
  website: string | null;
  city: string | null;
  plan_expires_at: string | null;
};

function teamOf(value: unknown): TeamBrand | null {
  if (Array.isArray(value)) return (value[0] as TeamBrand) ?? null;
  return (value as TeamBrand) ?? null;
}

/** The backend's owner-side number, as this site names its fields. */
type BackendHandle = NonNullable<
  paths["/raqamlar"]["get"]["responses"][200]["content"]["application/json"]["raqamlar"]
>[number];

function toOwned(h: BackendHandle): OwnedHandle {
  return {
    normalized: h.raqam,
    status: h.holat,
    name: h.ism ?? "",
    bio: h.bio ?? "",
    avatarUrl: h.rasm ?? null,
    links: (h.havolalar ?? []) as OwnedHandle["links"],
    // Zero is a gift and null was "never asked". The backend answers zero for
    // both, and a gift is the honest reading of the two here — nothing was
    // paid either way, and the reason lives on the admin side.
    pricePaid: h.tolangan ?? 0,
    claimedAt: h.olingan ?? null,
    reservedUntil: h.band_muddati ?? null,
    city: h.shahar ?? null,
    contactEmail: h.email ?? null,
    phone: h.telefon ?? null,
    position: h.lavozim ?? null,
    company: h.kompaniya ?? null,
    services: (h.xizmatlar ?? []) as Service[],
    // Already resolved: the backend applies the lapse rule, so this site no
    // longer has to compare two dates and a team's expiry to know what a plan
    // is worth today.
    plan: h.tarif,
    bannerUrl: h.banner ?? null,
    teamName: h.jamoa ?? null,
    commentsOpen: h.izohlar_ochiq,
    tags: h.teglar ?? [],
    viewCount: h.korishlar,
    cardDesign: isCardDesign(h.dizayn) ? h.dizayn : DEFAULT_CARD_DESIGN,
    deviceType: isDeviceType(h.qurilma) ? h.qurilma : DEFAULT_DEVICE_TYPE,
    customDesignUrl: h.maxsus_dizayn ?? null,
  };
}

// Everything the signed-in user owns or is currently holding.
export async function listHandlesForUser(): Promise<OwnedHandle[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar", {});
  if (error || !data) return [];

  return (data.raqamlar ?? []).map(toOwned);
}

/**
 * One number, read as its owner.
 *
 * Ownership is not checked here and never was: the backend filters on the
 * session's account, so a guessed number in the URL is a 404 rather than
 * somebody else's profile. The difference now is that the filter is on a
 * server the browser cannot talk to directly.
 */
export async function getOwnedHandle(normalized: string): Promise<OwnedHandle | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}", {
    params: { path: { raqam: normalized } },
  });
  if (error || !data?.raqam) return null;

  return toOwned(data.raqam);
}

export type Resident = {
  normalized: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  city: string | null;
  tags: string[];
  viewCount: number;
  lastSeenAt: string | null;
};

const RESIDENT_COLUMNS =
  "normalized, owner_name, bio, avatar_url, city, tags, view_count, last_seen_at";

function rowToResident(row: Record<string, unknown>): Resident {
  return {
    normalized: row.normalized as string,
    name: (row.owner_name as string) ?? (row.normalized as string),
    bio: (row.bio as string) ?? "",
    avatarUrl: (row.avatar_url as string) ?? null,
    city: (row.city as string) ?? null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    viewCount: Number(row.view_count ?? 0),
    lastSeenAt: (row.last_seen_at as string) ?? null,
  };
}

// The public directory. Only claimed handles appear — a reservation is an
// unfinished purchase, not a resident.
/**
 * The most recently claimed handles.
 *
 * Social proof that is true and moves on its own. The competitor's landing page
 * puts live counters where ours had an invented "2 481 visits this week" badge,
 * and the difference is not decoration: a number somebody made up says nothing,
 * and one that changes says people are buying.
 */
export async function listNewestResidents(limit = 8): Promise<Resident[]> {
  return residents({ yangi: true, soni: limit });
}

export async function listResidents(query = "", limit = 60): Promise<Resident[]> {
  return residents({ qidiruv: query.trim() || undefined, soni: limit });
}

/**
 * One read behind both of the above.
 *
 * The search term is no longer escaped here, and does not need to be: it goes
 * into a query parameter and reaches the database as a bound argument. The
 * version this replaces had to strip commas and parentheses out of what
 * somebody typed, because PostgREST parses the filter as an expression and a
 * comma in a name would have changed its meaning.
 */
async function residents(query: {
  qidiruv?: string;
  soni: number;
  yangi?: boolean;
}): Promise<Resident[]> {
  const { data, error } = await backend.GET("/rezidentlar", { params: { query } });
  if (error || !data) return [];

  return (data.rezidentlar ?? []).map((r) => ({
    normalized: r.raqam,
    name: r.ism,
    bio: r.tavsif ?? "",
    avatarUrl: r.rasm ?? null,
    city: r.shahar ?? null,
    tags: r.teglar ?? [],
    viewCount: r.korishlar,
    lastSeenAt: r.oxirgi_faollik ?? null,
  }));
}

export type TopHandle = {
  normalized: string;
  name: string;
  avatarUrl: string | null;
  views: number;
};

// Most-viewed claimed handles over the last few days.
export async function getTopHandles(days = 3, limit = 3): Promise<TopHandle[]> {
  const { data, error } = await backend.GET("/rezidentlar/top", {
    params: { query: { kun: days, soni: limit } },
  });
  if (error || !data) return [];

  return (data.raqamlar ?? []).map((r) => ({
    normalized: r.raqam,
    name: r.ism,
    avatarUrl: r.rasm ?? null,
    views: r.korishlar,
  }));
}

export type DirectoryCounts = { claimed: number; namespace: number };

// Headline counts for the directory. 26^3 * 10^3 is the whole AAA000 space,
// and the backend knows it — it is a property of the format, so it is stated
// once rather than multiplied out in every client.
export async function getDirectoryCounts(): Promise<DirectoryCounts> {
  const { data, error } = await backend.GET("/rezidentlar", {
    params: { query: { soni: 1 } },
  });
  if (error || !data) return { claimed: 0, namespace: 26 * 26 * 26 * 10 * 10 * 10 };

  return { claimed: data.egallangan, namespace: data.jami };
}

// Stamps the owner's numbers as recently active, which a profile shows.
// Called from the cabinet, the one page only an owner loads.
export async function touchLastSeen(client: Reader): Promise<void> {
  await client.POST("/men/faollik", {}).catch(() => {});
}
