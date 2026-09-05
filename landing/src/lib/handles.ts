import { effectivePlan, type PlanId } from "@/lib/plans";
import { readServices, type Service } from "@/lib/services";
import { cache } from "react";
import { DEFAULT_CARD_DESIGN, isCardDesign, type CardDesignId } from "@/lib/card-designs";
import { DEFAULT_DEVICE_TYPE, isDeviceType, type DeviceTypeId } from "@/lib/devices";
import { createServerSupabase } from "@/lib/supabase/server";
import { asReader, backend } from "@/lib/backend/client";
import type { paths } from "@/lib/backend/schema";

export type ClaimedProfile = {
  userId: string | null;
  name: string;
  bio: string;
  avatarUrl: string | null;
  links: { label: string; href: string }[];
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

// Local fallback so the profile page works before a Supabase project is connected.
const DEMO_PROFILES: Record<string, ClaimedProfile> = {
  MYN042: {
    userId: null,
    city: "Toshkent",
    contactEmail: null,
    phone: null,
    position: null,
    company: null,
    cardDesign: DEFAULT_CARD_DESIGN,
    plan: "free",
    services: [],
    bannerUrl: null,
    commentsOpen: false,
    recommendCount: 0,
    team: null,
    tags: ["Startup"],
    lastSeenAt: null,
    viewCount: 0,
    followerCount: 0,
    postCount: 0,
    name: "Aziz Karimov",
    bio: "Flex asoschisi. Raqamli shaxs va networking bilan shug'ullanaman.",
    avatarUrl: null,
    links: [
      { label: "Telegram", href: "https://t.me/azizkarimov" },
      { label: "Instagram", href: "https://instagram.com/azizkarimov" },
      { label: "Veb-sayt", href: "https://flex.com.uz" },
    ],
  },
};

export const getClaimedProfile = cache(async (normalized: string): Promise<ClaimedProfile | null> => {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return DEMO_PROFILES[normalized] ?? null;
  }

  const { data } = await supabase
    .from("handles")
    .select(
      "user_id, owner_name, bio, avatar_url, links, city, contact_email, phone, position, company, tags, last_seen_at, view_count, follower_count, post_count, recommend_count, card_design, plan, plan_expires_at, services, banner_url, comments_open, team_id, teams (name, logo_url, website, city, plan_expires_at)"
    )
    .eq("normalized", normalized)
    .eq("status", "claimed")
    .maybeSingle();

  if (!data) return null;

  // PostgREST returns an embedded row as an object or, for some shapes, a
  // single-element array. Normalising once here keeps every read below simple.
  const team = teamOf(data.teams);

  return {
    userId: data.user_id ?? null,
    name: data.owner_name ?? normalized,
    bio: data.bio ?? "",
    avatarUrl: data.avatar_url,
    links: Array.isArray(data.links) ? data.links : [],
    city: team?.city ?? data.city ?? null,
    contactEmail: data.contact_email ?? null,
    phone: data.phone ?? null,
    position: data.position ?? null,
    company: team?.name ?? data.company ?? null,
    cardDesign: isCardDesign(data.card_design) ? data.card_design : DEFAULT_CARD_DESIGN,
    plan: effectivePlan(data.plan, data.plan_expires_at, team?.plan_expires_at),
    services: readServices(data.services),
    bannerUrl: (data.banner_url as string) ?? null,
    commentsOpen: Boolean(data.comments_open),
    recommendCount: (data.recommend_count as number) ?? 0,
    team: team
      ? { name: team.name, logoUrl: team.logo_url, website: team.website }
      : null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    lastSeenAt: data.last_seen_at ?? null,
    viewCount: Number(data.view_count ?? 0),
    followerCount: Number(data.follower_count ?? 0),
    postCount: Number(data.post_count ?? 0),
  };
});

export type GenesisCard = {
  serial: string;
  status: "unsold" | "claimed";
  ownerName: string | null;
  ownerHandle: string | null;
  mintedAt: string | null;
};

// Local fallback: card #000001 exists as a demo before Supabase is connected.
const DEMO_GENESIS: Record<string, GenesisCard> = {
  "000001": {
    serial: "000001",
    status: "claimed",
    ownerName: "Aziz Karimov",
    ownerHandle: "MYN042",
    mintedAt: "2026-01-01",
  },
};

export const getGenesisCard = cache(async (serial: string): Promise<GenesisCard | null> => {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return DEMO_GENESIS[serial] ?? null;
  }

  const { data } = await supabase
    .from("genesis_cards")
    .select("normalized, status, owner_name, owner_handle, minted_at")
    .eq("normalized", serial)
    .maybeSingle();

  if (!data) return null;

  return {
    serial: data.normalized,
    status: data.status,
    ownerName: data.owner_name,
    ownerHandle: data.owner_handle,
    mintedAt: data.minted_at ? String(data.minted_at).slice(0, 10) : null,
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
  links: { label: string; href: string }[];
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

// Stamps the owner's handles as recently active. Called from the cabinet,
// which is the one page only an owner loads.
export async function touchLastSeen(userId: string): Promise<void> {
  const supabase = await createServerSupabase();
  if (!supabase) return;

  await supabase
    .from("handles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", userId);
}
