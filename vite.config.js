import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "PG Choir - Pyesa",
        short_name: "Pyesa",
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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Never serve the SPA shell for share pages or the API — share
        // links must load their real HTML (redirect + OG tags) even when
        // the service worker controls the navigation
        navigateFallbackDenylist: [/^\/share\//, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/files\/.*\.json$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "data-json",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    allowedHosts: true,
    // The API only exists in AWS; proxy /api to production during local dev
    // (writes go to the live site — override with PYESA_API_ORIGIN if needed).
    proxy: {
      "/api": {
        target: process.env.PYESA_API_ORIGIN || "https://pyesa.kdc.sh",
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: process.env.PYESA_API_ORIGIN || "https://pyesa.kdc.sh",
        changeOrigin: true,
      },
    },
  },
});
