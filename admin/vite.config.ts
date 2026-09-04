import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The admin panel is a plain single-page application, not a rendered site.
//
// Nothing here is public, nothing needs to be found by a search engine, and
// every screen is behind a sign-in — which is the whole argument for Vite
// rather than Next. The landing site keeps server rendering because a profile
// page tapped from a card has to arrive fast and be indexable; this one has
// neither requirement and gets a faster development loop for giving them up.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 5173 is Vite's default and something else on this machine already holds
    // it. Fixed rather than automatic, because the backend's allowed origins
    // have to name a port.
    port: 5174,
    strictPort: true,
    proxy: {
      // The panel talks to the backend as though it were served from the same
      // origin. That is not a convenience: it means the browser sends no
      // cross-origin request in development, so the code being written is the
      // code that runs in production behind one domain — and the backend never
      // has to grow a permissive CORS policy to accommodate a dev server.
      "/v1": {
        target: "http://127.0.0.1:8090",
        changeOrigin: true,
      },
    },
  },
});
