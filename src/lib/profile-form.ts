import "server-only";

import { buildProfileLinks } from "@/lib/links";
import { checkAvatar } from "@/lib/uploads";
import { uploadImage, isStorageConfigured } from "@/lib/storage";

export type ProfileInput = {
  name: string;
  bio: string;
  links: { label: string; href: string }[];
  avatarUrl: string | null;
  city: string | null;
  contactEmail: string | null;
  tags: string[];
};

const MAX_TAGS = 5;

// Tags are rendered as "#tag" and used in search, so they are reduced to
// letters and digits — no spaces, no punctuation that would need escaping.
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();

  for (const piece of raw.split(/[,\s]+/)) {
    const tag = piece.replace(/^#/, "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 20);
    if (tag) seen.add(tag);
    if (seen.size >= MAX_TAGS) break;
  }

  return [...seen];
}

// Shown publicly and turned into a mailto: link, so an address that is not
// one is dropped rather than rendered.
export function parseContactEmail(raw: string): string | null {
  const value = raw.trim().slice(0, 120);
  if (!value) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

export type ProfileRead =
  | { ok: true; profile: ProfileInput }
  | { ok: false; error: string };

// Shared by the claim form and the edit form: both accept the same fields and
// must apply the same validation, so neither becomes the weaker door.
export async function readProfileForm(
  formData: FormData,
  normalized: string,
  currentAvatarUrl: string | null = null
): Promise<ProfileRead> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 280);

  if (!name) return { ok: false, error: "Ism kiritish shart." };

  const links = buildProfileLinks({
    telegram: String(formData.get("telegram") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    website: String(formData.get("website") ?? ""),
  });

  let avatarUrl = currentAvatarUrl;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const check = checkAvatar(avatar);
    if (!check.ok) return { ok: false, error: check.error };

    if (isStorageConfigured) {
      const buffer = Buffer.from(await avatar.arrayBuffer());
      // Overwrites the previous avatar for this handle; a stale file would
      // otherwise linger in the bucket with nothing pointing at it.
      const uploaded = await uploadImage(
        `handles/${normalized}.${check.extension}`,
        buffer,
        check.contentType
      );
      // A cache-busting suffix, since the object key stays the same.
      avatarUrl = uploaded ? `${uploaded}?v=${Date.now()}` : avatarUrl;
    }
  }

  return {
    ok: true,
    profile: {
      name,
      bio,
      links,
      avatarUrl,
      city: String(formData.get("city") ?? "").trim().slice(0, 60) || null,
      contactEmail: parseContactEmail(String(formData.get("contactEmail") ?? "")),
      tags: parseTags(String(formData.get("tags") ?? "")),
    },
  };
}

// Splits a stored profile link back into the value its form field expects.
export function linkFieldValue(
  links: { label: string; href: string }[],
  label: string
): string {
  const link = links.find((l) => l.label === label);
  if (!link) return "";
  if (label === "Veb-sayt") return link.href;
  return link.href.split("/").filter(Boolean).pop() ?? "";
}
