import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { RESERVED } from "./proxy";

// The root path belongs to handles, so the proxy answers 404 for any single
// segment it does not recognise. That makes RESERVED a list somebody has to
// remember to extend, and forgetting it would take a working page off the site
// quietly. This reads the routes instead of trusting the memory.
describe("RESERVED", () => {
  it("names every static route directly under src/app", () => {
    const routes = readdirSync(join(__dirname, "app"), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("[") && !e.name.startsWith("_"))
      .map((e) => e.name);

    expect(routes.length).toBeGreaterThan(10);
    expect(routes.filter((r) => !RESERVED.has(r))).toEqual([]);
  });
});
