import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";

export type ClaimedProfile = {
  userId: string | null;
  name: string;
  bio: string;
  avatarUrl: string | null;
  links: { label: string; href: string }[];
};

// Local fallback so the profile page works before a Supabase project is connected.
const DEMO_PROFILES: Record<string, ClaimedProfile> = {
  MYN042: {
    userId: null,
    name: "Aziz Karimov",
    bio: "Mynt asoschisi. Raqamli shaxs va networking bilan shug'ullanaman.",
    avatarUrl: null,
    links: [
      { label: "Telegram", href: "https://t.me/azizkarimov" },
      { label: "Instagram", href: "https://instagram.com/azizkarimov" },
      { label: "Veb-sayt", href: "https://mynt.uz" },
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
    .select("user_id, owner_name, bio, avatar_url, links")
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
  };
}

const OWNED_COLUMNS =
  "normalized, status, owner_name, bio, avatar_url, links, price_paid, claimed_at, reserved_until";

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
