import createClient from "openapi-fetch";

import type { paths } from "./schema";

// The one way this panel talks to the backend.
//
// `paths` is generated from the backend's own OpenAPI document by `npm run
// api`, so the compiler knows every route, its parameters and its response
// shape. A field renamed in Go breaks `npm run build` here rather than
// breaking a screen in front of somebody. That is the whole reason the backend
// publishes a specification instead of a README.
//
// The base is relative. In development Vite proxies /v1 to the backend, and in
// production both are served from one domain — so the browser never makes a
// cross-origin request and the backend never needs a CORS policy that could be
// got wrong.
export const api = createClient<paths>({
  baseUrl: "/",

  // The session cookie is sent, and only to this origin. `include` would send
  // it cross-origin too, which is not wanted and would require the backend to
  // name an allowed origin — one more thing to get wrong for no gain.
  credentials: "same-origin",
});
