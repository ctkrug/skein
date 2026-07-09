import { defineConfig } from "vite";

// Relative base so the built site can be served from any subpath
// (e.g. apps.charliekrug.com/scenario-loom).
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
