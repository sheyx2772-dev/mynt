import "server-only";

// Avatars are user-supplied binaries served back to every visitor, so the
// type is taken from this allowlist — never from the upload's own filename or
// declared MIME type — and the size is capped before anything is buffered.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

// A cover spans the whole card and is usually a photograph rather than a
// portrait crop, so it gets more room — but the same allowlist, since it is the
// same kind of user-supplied binary served to every visitor.
export const MAX_BANNER_BYTES = 4 * 1024 * 1024; // 4 MB

export type AvatarCheck =
  | { ok: true; extension: string; contentType: string }
  | { ok: false; error: string };

function checkImage(file: File, limit: number, tooBig: string): AvatarCheck {
  if (file.size > limit) return { ok: false, error: tooBig };

  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    return { ok: false, error: "Faqat JPG, PNG yoki WEBP rasm yuklash mumkin." };
  }

  return { ok: true, extension, contentType: file.type };
}

export function checkAvatar(file: File): AvatarCheck {
  return checkImage(file, MAX_AVATAR_BYTES, "Rasm hajmi 2 MB dan oshmasligi kerak.");
}

export function checkBanner(file: File): AvatarCheck {
  return checkImage(file, MAX_BANNER_BYTES, "Fon rasmi 4 MB dan oshmasligi kerak.");
}
