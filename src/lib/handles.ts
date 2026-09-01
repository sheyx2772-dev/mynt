import { activePlan, type PlanId } from "@/lib/plans";
import { cache } from "react";
import { DEFAULT_CARD_DESIGN, isCardDesign, type CardDesignId } from "@/lib/card-designs";
import { DEFAULT_DEVICE_TYPE, isDeviceType, type DeviceTypeId } from "@/lib/devices";
import { createServerSupabase } from "@/lib/supabase/server";

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
      "user_id, owner_name, bio, avatar_url, links, city, contact_email, phone, position, company, tags, last_seen_at, view_count, follower_count, post_count, card_design, plan, plan_expires_at"
    )
    .eq("normalized", normalized)
    .eq("status", "claimed")
    .maybeSingle();

  if (!data) return null;

  return {
    userId: data.user_id ?? null,
    name: data.owner_name ?? normalized,
    bio: data.bio ?? "",
    avatarUrl: data.avatar_url,
    links: Array.isArray(data.links) ? data.links : [],
    city: data.city ?? null,
    contactEmail: data.contact_email ?? null,
    phone: data.phone ?? null,
    position: data.position ?? null,
    company: data.company ?? null,
    cardDesign: isCardDesign(data.card_design) ? data.card_design : DEFAULT_CARD_DESIGN,
    plan: activePlan(data.plan, data.plan_expires_at),
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
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("handles")
    .select("normalized, updated_at")
    .eq("status", "claimed")
    .order("claimed_at", { ascending: false })
    .limit(10_000);

  if (!data) return [];

  return data.map((row) => ({
    normalized: row.normalized,
    updatedAt: row.updated_at ?? null,
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
  tags: string[];
  viewCount: number;
  cardDesign: CardDesignId;
  deviceType: DeviceTypeId;
  /** Artwork made for this handle alone, which outranks the catalogue design. */
  customDesignUrl: string | null;
};

function rowToOwned(row: Record<string, unknown>): OwnedHandle {
  return {
    normalized: row.normalized as string,
    status: row.status as OwnedHandle["status"],
    name: (row.owner_name as string) ?? "",
    bio: (row.bio as string) ?? "",
    avatarUrl: (row.avatar_url as string) ?? null,
    links: Array.isArray(row.links) ? (row.links as OwnedHandle["links"]) : [],
    pricePaid: row.price_paid === null || row.price_paid === undefined ? null : Number(row.price_paid),
    claimedAt: (row.claimed_at as string) ?? null,
    reservedUntil: (row.reserved_until as string) ?? null,
    city: (row.city as string) ?? null,
    contactEmail: (row.contact_email as string) ?? null,
    phone: (row.phone as string) ?? null,
    position: (row.position as string) ?? null,
    company: (row.company as string) ?? null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    viewCount: Number(row.view_count ?? 0),
    cardDesign: isCardDesign(row.card_design) ? row.card_design : DEFAULT_CARD_DESIGN,
    deviceType: isDeviceType(row.device_type) ? row.device_type : DEFAULT_DEVICE_TYPE,
    customDesignUrl: (row.custom_design_url as string) ?? null,
  };
}

// One string literal, not a concatenation: Supabase infers the row type from
// this text, and a joined expression makes it give up and return an error type.
const OWNED_COLUMNS =
  "normalized, status, owner_name, bio, avatar_url, links, price_paid, claimed_at, reserved_until, city, contact_email, phone, position, company, tags, view_count, card_design, device_type, custom_design_url";

// Everything the signed-in user owns or is currently holding.
export async function listHandlesForUser(userId: string): Promise<OwnedHandle[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("handles")
    .select(OWNED_COLUMNS)
    .eq("user_id", userId)
    .order("claimed_at", { ascending: false, nullsFirst: false });

  return (data ?? []).map(rowToOwned);
}

// Ownership is re-checked in the query itself, so a guessed handle in the URL
// cannot open someone else's profile for editing.
export async function getOwnedHandle(
  normalized: string,
  userId: string
): Promise<OwnedHandle | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("handles")
    .select(OWNED_COLUMNS)
    .eq("normalized", normalized)
    .eq("user_id", userId)
    .maybeSingle();

  return data ? rowToOwned(data) : null;
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
export async function listResidents(query = "", limit = 60): Promise<Resident[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  let request = supabase
    .from("handles")
    .select(RESIDENT_COLUMNS)
    .eq("status", "claimed")
    .order("view_count", { ascending: false })
    .limit(limit);

  const term = query.trim();
  if (term) {
    // Escaped so a comma or parenthesis in the term cannot alter the filter
    // expression PostgREST parses.
    const safe = term.replace(/[,()\\]/g, " ").slice(0, 40);
    request = request.or(`normalized.ilike.%${safe}%,owner_name.ilike.%${safe}%,city.ilike.%${safe}%`);
  }

  const { data } = await request;
  return (data ?? []).map(rowToResident);
}

export type TopHandle = {
  normalized: string;
  name: string;
  avatarUrl: string | null;
  views: number;
};

// Most-viewed claimed handles over the last few days.
export async function getTopHandles(days = 3, limit = 3): Promise<TopHandle[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase.rpc("top_handles", { p_days: days, p_limit: limit });

  return (data ?? []).map((row: Record<string, unknown>) => ({
    normalized: String(row.normalized),
    name: (row.owner_name as string) ?? String(row.normalized),
    avatarUrl: (row.avatar_url as string) ?? null,
    views: Number(row.views),
  }));
}

export type DirectoryCounts = { claimed: number; namespace: number };

// Headline counts for the directory. 26^3 * 10^3 is the whole AAA000 space.
export async function getDirectoryCounts(): Promise<DirectoryCounts> {
  const supabase = await createServerSupabase();
  const namespace = 26 * 26 * 26 * 10 * 10 * 10;
  if (!supabase) return { claimed: 0, namespace };

  const { count } = await supabase
    .from("handles")
    .select("normalized", { count: "exact", head: true })
    .eq("status", "claimed");

  return { claimed: count ?? 0, namespace };
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
