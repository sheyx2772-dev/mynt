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
