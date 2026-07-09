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
    coverage: {
      provider: "v8",
      include: ["src/**"],
      // Boot glue and type shims carry no logic worth covering.
      exclude: ["src/main.ts", "src/vite-env.d.ts"],
    },
  },
});
