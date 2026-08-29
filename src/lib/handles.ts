import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type ClaimedProfile = {
  name: string;
  bio: string;
  links: { label: string; href: string }[];
};

// Local fallback so the profile page works before a Supabase project is connected.
const DEMO_PROFILES: Record<string, ClaimedProfile> = {
  MYN042: {
    name: "Aziz Karimov",
    bio: "Mynt asoschisi. Raqamli shaxs va networking bilan shug'ullanaman.",
    links: [
      { label: "Telegram", href: "https://t.me/azizkarimov" },
      { label: "Instagram", href: "https://instagram.com/azizkarimov" },
      { label: "Veb-sayt", href: "https://mynt.uz" },
    ],
  },
};

export async function getClaimedProfile(normalized: string): Promise<ClaimedProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return DEMO_PROFILES[normalized] ?? null;
  }

  const { data } = await supabase
    .from("handles")
    .select("owner_name, bio, links, status")
    .eq("normalized", normalized)
    .eq("status", "claimed")
    .maybeSingle();

  if (!data) return null;

  return {
    name: data.owner_name ?? normalized,
    bio: data.bio ?? "",
    links: Array.isArray(data.links) ? data.links : [],
  };
}

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

export async function getGenesisCard(serial: string): Promise<GenesisCard | null> {
  if (!isSupabaseConfigured || !supabase) {
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
    mintedAt: data.minted_at,
  };
}
