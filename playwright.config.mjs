import { defineConfig } from '@playwright/test';

// Run: npm run build && npx playwright test (Playwright is installed ad hoc, see CLAUDE.md)
export default defineConfig({
  testDir: 'e2e',
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
});
