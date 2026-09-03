import { beforeEach, describe, expect, it, vi } from "vitest";

// What happens to the rest of an edit when the picture does not make it.
//
// Worth a test of its own because the failure is silent by nature: uploadImage
// returns null rather than throwing, so every path here succeeds. The bug this
// covers was a profile that saved, reported "Saqlandi.", and had no photo on
// it — so the owner picked the same photo again, and again.

const uploadImage = vi.fn();
let configured = true;

vi.mock("@/lib/storage", () => ({
  uploadImage: (...args: unknown[]) => uploadImage(...args),
  get isStorageConfigured() {
    return configured;
  },
}));

const { readProfileForm } = await import("@/lib/profile-form");

function png(name = "avatar.png"): File {
  const file = new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });
  Object.defineProperty(file, "size", { value: 4096 });
  return file;
}

function form(extra: Record<string, string | File> = {}): FormData {
  const data = new FormData();
  data.set("name", "Dilnoza Karimova");
  data.set("bio", "Qandolatchi");
  for (const [key, value] of Object.entries(extra)) data.set(key, value);
  return data;
}

beforeEach(() => {
  uploadImage.mockReset();
  configured = true;
});

describe("readProfileForm, when a picture fails", () => {
  it("still saves the text, and says the picture did not go", async () => {
    uploadImage.mockResolvedValue(null);

    const read = await readProfileForm(form({ avatar: png() }), "NAV001");

    expect(read.ok).toBe(true);
    if (!read.ok) return;
    // The bio survives. Losing a rewritten profile because an image host is
    // down would be the worse trade of the two.
    expect(read.profile.name).toBe("Dilnoza Karimova");
    expect(read.profile.bio).toBe("Qandolatchi");
    expect(read.imageFailed).toBe(true);
  });

  it("keeps the picture that was already there", async () => {
    uploadImage.mockResolvedValue(null);

    const read = await readProfileForm(
      form({ avatar: png() }),
      "NAV001",
      "https://cdn.example/handles/NAV001.png?v=1",
    );

    expect(read.ok).toBe(true);
    if (!read.ok) return;
    // A failed replacement must not blank the old face.
    expect(read.profile.avatarUrl).toBe("https://cdn.example/handles/NAV001.png?v=1");
  });

  it("reports it when there is no store configured at all", async () => {
    configured = false;

    const read = await readProfileForm(form({ avatar: png() }), "NAV001");

    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.imageFailed).toBe(true);
    // Nothing was even attempted.
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("says nothing when no picture was chosen", async () => {
    const read = await readProfileForm(form(), "NAV001");

    expect(read.ok).toBe(true);
    if (!read.ok) return;
    // The flag has to stay absent, or every ordinary save shows a warning.
    expect(read.imageFailed).toBeUndefined();
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("says nothing when the picture goes through", async () => {
    uploadImage.mockResolvedValue("https://cdn.example/handles/NAV001.png");

    const read = await readProfileForm(form({ avatar: png() }), "NAV001");

    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.imageFailed).toBeUndefined();
    expect(read.profile.avatarUrl).toMatch(/^https:\/\/cdn\.example\/handles\/NAV001\.png\?v=\d+$/);
  });

  it("reports a failed banner as well as a failed face", async () => {
    uploadImage.mockResolvedValue(null);

    const read = await readProfileForm(
      form({ banner: png("banner.png") }),
      "NAV001",
      null,
      null,
      "premium",
    );

    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.imageFailed).toBe(true);
  });

  it("leaves a free plan's banner alone without complaining", async () => {
    uploadImage.mockResolvedValue(null);

    const read = await readProfileForm(
      form({ banner: png("banner.png") }),
      "NAV001",
      null,
      null,
      "free",
    );

    expect(read.ok).toBe(true);
    if (!read.ok) return;
    // The field is unreachable on a free profile, so a posted one is a guard
    // rather than a message — and must not raise a warning about an upload
    // that was never going to be attempted.
    expect(read.imageFailed).toBeUndefined();
    expect(uploadImage).not.toHaveBeenCalled();
  });
});
