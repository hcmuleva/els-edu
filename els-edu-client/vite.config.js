import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use "./" for Capacitor/mobile builds, "/els-kids" for web deployment
  base: process.env.VITE_BASE_PATH || "./",
  server: {
    // allowedHosts: "all", // Allow ngrok and other tunneling services
    watch: {
      // Ignore heavy dirs to save watchers
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    },
  },
  build: {
    minify: "esbuild", // Use esbuild for minification (default, but explicit)
    sourcemap: false, // Disable sourcemaps in production for security
  },
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
});
