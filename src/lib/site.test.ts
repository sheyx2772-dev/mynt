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
    process.env.NEXT_PUBLIC_SITE_URL = "https://mynt.uz";
    const { getSiteOrigin } = await loadSite();

    headerStore.set("x-forwarded-host", "evil.com");
    headerStore.set("host", "evil.com");

    await expect(getSiteOrigin()).resolves.toBe("https://mynt.uz");
  });

  // The attack this guards: a forged host would otherwise end up inside the
  // one-time sign-in link mailed to the victim.
  it("refuses a forged host when nothing is configured", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { getSiteOrigin } = await loadSite();

    headerStore.set("x-forwarded-host", "evil.com");
    await expect(getSiteOrigin()).resolves.toBe("https://mynt.uz");

    headerStore.clear();
    headerStore.set("host", "mynt.uz.evil.com");
    await expect(getSiteOrigin()).resolves.toBe("https://mynt.uz");
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
    await expect(getSiteOrigin()).resolves.toBe("https://mynt.uz");
  });

  it("trims a trailing slash from the configured origin", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://mynt.uz/";
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe("https://mynt.uz");
  });
});
