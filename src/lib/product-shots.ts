import "server-only";
import fs from "node:fs";
import path from "node:path";

// Product photography is dropped into public/mahsulot/ by hand — see
// dizayn/rasm-promptlari.md. Until a file is there the page falls back to the
// drawn device, so a missing shot is a softer look rather than a broken image.
// Resolved at build time; a newly added file needs a rebuild to appear.

const DIR = path.join(process.cwd(), "public", "mahsulot");
const EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export type ShotName = "hero" | "karta" | "uzuk" | "braslet" | "oila" | "tegizish";

export function productShot(name: ShotName): string | null {
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(path.join(DIR, `${name}.${ext}`))) {
      return `/mahsulot/${name}.${ext}`;
    }
  }
  return null;
}
