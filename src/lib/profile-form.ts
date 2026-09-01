import { parseServices, MAX_SERVICES, type Service } from "@/lib/services";
import { serviceLimit, type PlanId } from "@/lib/plans";
import "server-only";

import { buildProfileLinks } from "@/lib/links";
import { checkAvatar, checkBanner } from "@/lib/uploads";
import { uploadImage, isStorageConfigured } from "@/lib/storage";

export type ProfileInput = {
  name: string;
  bio: string;
  links: { label: string; href: string }[];
  avatarUrl: string | null;
  bannerUrl: string | null;
  city: string | null;
  contactEmail: string | null;
  phone: string | null;
  position: string | null;
  company: string | null;
  services: Service[];
  commentsOpen: boolean;
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
/**
 * A phone number as a person types it, or nothing.
 *
 * Digits, spaces and the usual punctuation are kept as entered rather than
 * normalised: a number is dialled by a phone, and the owner's own formatting
 * is what they recognise on their card.
 */
export function parsePhone(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  return /^[0-9+()\- ]{7,30}$/.test(value) ? value : null;
}

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
  currentAvatarUrl: string | null = null,
  currentBannerUrl: string | null = null,
  // The plan decides how much of the form is kept. Defaulting to free means a
  // caller that forgets to pass it under-saves rather than over-saves, which is
  // the safe direction: nothing is silently granted.
  plan: PlanId = "free",
): Promise<ProfileRead> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 280);

  if (!name) return { ok: false, error: "Ism kiritish shart." };

  const links = buildProfileLinks({
    booking: String(formData.get("booking") ?? ""),
    telegram: String(formData.get("telegram") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    linkedin: String(formData.get("linkedin") ?? ""),
    facebook: String(formData.get("facebook") ?? ""),
    youtube: String(formData.get("youtube") ?? ""),
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

  // The cover is premium; the face is not. A free profile that somehow posts
  // the field keeps whatever it had rather than being told off — there is no
  // way to reach it from the form, so this is a guard, not a message.
  let bannerUrl = currentBannerUrl;
  const banner = formData.get("banner");
  if (plan === "premium" && banner instanceof File && banner.size > 0) {
    const check = checkBanner(banner);
    if (!check.ok) return { ok: false, error: check.error };

    if (isStorageConfigured) {
      const buffer = Buffer.from(await banner.arrayBuffer());
      const uploaded = await uploadImage(
        `banners/${normalized}.${check.extension}`,
        buffer,
        check.contentType,
      );
      bannerUrl = uploaded ? `${uploaded}?v=${Date.now()}` : bannerUrl;
    }
  }

  // Clearing it is a separate box, so a premium owner can go back to the card's
  // own artwork without having to upload something else over it.
  if (String(formData.get("bannerClear") ?? "") === "1") bannerUrl = null;

  return {
    ok: true,
    profile: {
      name,
      bio,
      links,
      avatarUrl,
      bannerUrl,
      city: String(formData.get("city") ?? "").trim().slice(0, 60) || null,
      contactEmail: parseContactEmail(String(formData.get("contactEmail") ?? "")),
      phone: parsePhone(String(formData.get("phone") ?? "")),
      position: String(formData.get("position") ?? "").trim().slice(0, 80) || null,
      company: String(formData.get("company") ?? "").trim().slice(0, 80) || null,
      commentsOpen: String(formData.get("commentsOpen") ?? "") === "1",
      services: parseServices(
        Array.from({ length: MAX_SERVICES }, (_, i) => ({
          name: String(formData.get(`service${i}Name`) ?? ""),
          price: String(formData.get(`service${i}Price`) ?? ""),
        })),
        serviceLimit(plan),
      ),
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
  // These two are whole addresses, not names appended to a known base.
  if (label === "Veb-sayt" || label === "Uchrashuv") return link.href;
  // wa.me carries the number itself, and the field asks for a number.
  if (label === "WhatsApp") return link.href.replace("https://wa.me/", "+");
  return link.href.split("/").filter(Boolean).pop() ?? "";
}
