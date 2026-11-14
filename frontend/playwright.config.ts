import { defineConfig } from '@playwright/test'

if (!process.env.HEALTH7_E2E_DATABASE_URL) throw new Error('Run node e2e/run.mjs with TEST_DATABASE_URL; never use the demo database')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    browserName: 'chromium',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {},
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node ../backend/dist/server.js',
      url: 'http://127.0.0.1:3003/health',
      reuseExistingServer: false,
      env: {
        DATABASE_URL: process.env.HEALTH7_E2E_DATABASE_URL,
        PORT: '3003', HOST: '127.0.0.1', COOKIE_SECURE: 'false',
        CORS_ORIGINS: 'http://127.0.0.1:5174', AI_PROVIDER_URL: '',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://127.0.0.1:3003' },
    },
  ],
})
