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

export type AvatarCheck =
  | { ok: true; extension: string; contentType: string }
  | { ok: false; error: string };

export function checkAvatar(file: File): AvatarCheck {
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Rasm hajmi 2 MB dan oshmasligi kerak." };
  }

  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    return { ok: false, error: "Faqat JPG, PNG yoki WEBP rasm yuklash mumkin." };
  }

  return { ok: true, extension, contentType: file.type };
}
