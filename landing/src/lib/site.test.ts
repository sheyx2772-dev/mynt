import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// headers() only exists inside a request, so it is stubbed here.
const headerStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => headerStore.get(k.toLowerCase()) ?? null }),
}));

const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

async function loadSite() {
  vi.resetModules();
  return import("./site");
}

beforeEach(() => headerStore.clear());
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
});

describe("getSiteOrigin", () => {
  it("uses the configured origin and ignores the request entirely", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flex.com.uz";
    const { getSiteOrigin } = await loadSite();

    headerStore.set("x-forwarded-host", "evil.com");
    headerStore.set("host", "evil.com");

    await expect(getSiteOrigin()).resolves.toBe("https://flex.com.uz");
  });

  // The attack this guards: a forged host would otherwise end up inside the
  // one-time sign-in link mailed to the victim.
  it("refuses a forged host when nothing is configured", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { getSiteOrigin } = await loadSite();

    headerStore.set("x-forwarded-host", "evil.com");
    await expect(getSiteOrigin()).resolves.toBe("https://flex.com.uz");

    headerStore.clear();
    headerStore.set("host", "flex.com.uz.evil.com");
    await expect(getSiteOrigin()).resolves.toBe("https://flex.com.uz");
  });

  it("still works on localhost for development", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { getSiteOrigin } = await loadSite();

    headerStore.set("host", "localhost:3000");
    await expect(getSiteOrigin()).resolves.toBe("http://localhost:3000");

    headerStore.clear();
    headerStore.set("host", "127.0.0.1:53384");
    await expect(getSiteOrigin()).resolves.toBe("http://127.0.0.1:53384");
  });

  it("is not fooled by a host that merely mentions localhost", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { getSiteOrigin } = await loadSite();

    headerStore.set("host", "localhost.evil.com");
    await expect(getSiteOrigin()).resolves.toBe("https://flex.com.uz");
  });

  it("trims a trailing slash from the configured origin", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flex.com.uz/";
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe("https://flex.com.uz");
  });
});

describe("pointUrl", () => {
  it("carries the table, so a request says where it came from", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flex.com.uz";
    const { pointUrl } = await loadSite();
    expect(pointUrl("NAV001", "7", "qr")).toBe("https://flex.com.uz/NAV001?src=qr&stol=7");
  });

  it("records a chip as a tap and a code as a scan", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flex.com.uz";
    const { pointUrl } = await loadSite();
    expect(pointUrl("NAV001", "7", "nfc")).toContain("src=nfc");
    expect(pointUrl("NAV001", "7", "qr")).toContain("src=qr");
  });

  it("escapes a table that was given a name", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flex.com.uz";
    const { pointUrl } = await loadSite();
    expect(pointUrl("NAV001", "Terrasa 1", "qr")).toBe(
      "https://flex.com.uz/NAV001?src=qr&stol=Terrasa%201",
    );
  });

  it("drops what a label may not contain, rather than ending the query early", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flex.com.uz";
    const { pointUrl } = await loadSite();
    // "7&src=nfc" would otherwise let a printed sticker rewrite the source.
    expect(pointUrl("NAV001", "7&src=nfc", "qr")).toBe(
      "https://flex.com.uz/NAV001?src=qr&stol=7srcnfc",
    );
  });

  it("is the plain profile when there is no tag on it", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flex.com.uz";
    const { pointUrl } = await loadSite();
    expect(pointUrl("NAV001", null, "qr")).toBe("https://flex.com.uz/NAV001?src=qr");
    expect(pointUrl("NAV001", "   ", "qr")).toBe("https://flex.com.uz/NAV001?src=qr");
  });
});
