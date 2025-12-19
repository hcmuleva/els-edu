import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/els-kids", // <-- important for deployment under emeelan.com/els
  server: {
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
