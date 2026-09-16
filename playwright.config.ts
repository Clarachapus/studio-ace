import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3100", locale: "fr-FR" },
  webServer: {
    command: "NEXT_DIST_DIR=.next-e2e npm run build && NEXT_DIST_DIR=.next-e2e npx next start -p 3100",
    url: "http://localhost:3100/fr",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
