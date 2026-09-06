import { readFileSync } from "node:fs";

// Vitest does not read .env.local. Integration tests that talk to the real
// project load it explicitly through this helper.
export function loadEnvLocal(): void {
  let raw: string;
  try {
    raw = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }

  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
