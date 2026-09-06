import "server-only";
import createClient from "openapi-fetch";

import type { paths } from "./schema";

// The one way this site talks to the backend.
//
// `paths` is generated from the backend's own OpenAPI document by `npm run
// api`, so the compiler knows every route, its parameters and its response
// shape. A field renamed in Go breaks the build here rather than a page in
// front of somebody.
//
// `server-only`: this module must never reach the browser. Not because the
// address is secret — it is not — but because the site talks to the backend
// over the container network, by container name. That address does not resolve
// anywhere else, and a component that imported this by accident would fail at
// runtime in production and nowhere else.
const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://127.0.0.1:8090"
).replace(/\/$/, "");

export const backend = createClient<paths>({ baseUrl: `${BACKEND_URL}/v1` });
