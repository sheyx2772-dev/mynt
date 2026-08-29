import { pool, isDbConfigured } from "@/lib/db";

export type ClaimedProfile = {
  name: string;
  bio: string;
  links: { label: string; href: string }[];
};

// Local fallback so the profile page works before the Postgres container is up.
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
  if (!isDbConfigured || !pool) {
    return DEMO_PROFILES[normalized] ?? null;
  }

  const { rows } = await pool.query(
    `select owner_name, bio, links from handles where normalized = $1 and status = 'claimed'`,
    [normalized]
  );
  const row = rows[0];
  if (!row) return null;

  return {
    name: row.owner_name ?? normalized,
    bio: row.bio ?? "",
    links: Array.isArray(row.links) ? row.links : [],
  };
}

export type GenesisCard = {
  serial: string;
  status: "unsold" | "claimed";
  ownerName: string | null;
  ownerHandle: string | null;
  mintedAt: string | null;
};

// Local fallback: card #000001 exists as a demo before the Postgres container is up.
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
  if (!isDbConfigured || !pool) {
    return DEMO_GENESIS[serial] ?? null;
  }

  const { rows } = await pool.query(
    `select normalized, status, owner_name, owner_handle, minted_at from genesis_cards where normalized = $1`,
    [serial]
  );
  const row = rows[0];
  if (!row) return null;

  return {
    serial: row.normalized,
    status: row.status,
    ownerName: row.owner_name,
    ownerHandle: row.owner_handle,
    mintedAt: row.minted_at instanceof Date ? row.minted_at.toISOString().slice(0, 10) : row.minted_at,
  };
}
