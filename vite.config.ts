import { defineConfig } from "vitest/config";

export default defineConfig({
  // Served from https://<user>.github.io/TaskFlow/ on GitHub Pages.
  base: "/TaskFlow/",
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/main.ts"],
    },
  },
});
