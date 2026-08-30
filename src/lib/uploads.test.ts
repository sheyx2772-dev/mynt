import { describe, it, expect } from "vitest";
import { checkAvatar, MAX_AVATAR_BYTES } from "./uploads";

function fakeFile(type: string, size: number): File {
  const file = new File([], "avatar", { type });
  // File size is read-only, so stub it rather than allocating megabytes.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("checkAvatar", () => {
  it("accepts the allowed image types and reports their extension", () => {
    expect(checkAvatar(fakeFile("image/jpeg", 1000))).toEqual({
      ok: true,
      extension: "jpg",
      contentType: "image/jpeg",
    });
    expect(checkAvatar(fakeFile("image/png", 1000))).toMatchObject({ ok: true, extension: "png" });
    expect(checkAvatar(fakeFile("image/webp", 1000))).toMatchObject({ ok: true, extension: "webp" });
  });

  // The extension comes from this allowlist, never from the upload itself —
  // otherwise the stored object key would be attacker-controlled.
  it("rejects types that aren't on the allowlist", () => {
    for (const type of ["image/svg+xml", "text/html", "application/pdf", "", "image/gif"]) {
      expect(checkAvatar(fakeFile(type, 1000)).ok, type).toBe(false);
    }
  });

  it("rejects files over the size cap", () => {
    expect(checkAvatar(fakeFile("image/png", MAX_AVATAR_BYTES + 1)).ok).toBe(false);
    expect(checkAvatar(fakeFile("image/png", MAX_AVATAR_BYTES)).ok).toBe(true);
  });

  it("checks size before type, so an oversized file fails even if allowed", () => {
    const result = checkAvatar(fakeFile("image/png", MAX_AVATAR_BYTES + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("2 MB");
  });
});
