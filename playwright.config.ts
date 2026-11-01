import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  workers: 1, // Sequential execution for stable and clear device-by-device logs
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    channel: 'chrome',
    trace: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'Apple iPhone (iOS)',
      use: {
        ...devices['iPhone 14'],
        defaultBrowserType: 'chromium',
        channel: 'chrome',
      },
    },
    {
      name: 'Apple iPad (iPadOS)',
      use: {
        ...devices['iPad Pro 11'],
        defaultBrowserType: 'chromium',
        channel: 'chrome',
      },
    },
    {
      name: 'Android Phone (Android OS)',
      use: {
        ...devices['Pixel 7'],
        defaultBrowserType: 'chromium',
        channel: 'chrome',
      },
    },
    {
      name: 'Web (Desktop Chrome)',
      use: {
        viewport: { width: 1280, height: 800 },
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'node scripts/server.js',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 15000,
  },
});

