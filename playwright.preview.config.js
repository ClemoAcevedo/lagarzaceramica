import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests-preview',
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4177/',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4177',
    url: 'http://127.0.0.1:4177/',
    reuseExistingServer: false,
  },
});
