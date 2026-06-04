import { defineConfig, devices } from '@playwright/test';

// บังคับให้วิ่งหา REAL Backend บน VM เสมอตอนเทส (ห้ามรัน Mock)
process.env.VITE_USE_MOCK = 'false';
process.env.USE_REAL_BACKEND = 'true';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_USE_MOCK: 'false',
      USE_REAL_BACKEND: 'true',
    },
  },
});
