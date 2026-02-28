import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
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
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,woff2}",
          "files/**/*.json",
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    allowedHosts: true,
  },
});
