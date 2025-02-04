import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "PG Choir - Pyesa",
        short_name: "PGC",
        description: "Choir companion app during mass.",
        theme_color: "#1e1e2e",
        background_color: "#1e1e2e",
        display: "standalone",
        icons: [
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/pyesa\.kdc\.sh\/api.*$/, // Adjust to match your API
            handler: "NetworkFirst", // Use 'NetworkFirst' if you want fresh data or CacheFirst
            options: {
              cacheName: "api-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // Cache for 1 year
                maxEntries: 1000, // Store up to 50 requests
              },
              cacheableResponse: {
                statuses: [200], // Only cache successful responses
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Enables PWA in development mode
      },
    }),
  ],
  server: {
    allowedHosts: true,
  },
});
