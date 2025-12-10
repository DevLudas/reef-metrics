import { getViteConfig } from "astro/config";
import { defineConfig } from "vitest/config";

export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      exclude: ["node_modules/", "dist/", ".astro/", "e2e/"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        exclude: [
          "node_modules/",
          "dist/",
          ".astro/",
          "**/*.d.ts",
          "**/types.ts",
          "src/pages/**",
          "src/layouts/**",
          "e2e/",
        ],
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  })
);
