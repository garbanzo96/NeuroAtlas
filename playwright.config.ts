import { defineConfig, devices } from '@playwright/test';

// Si existe un Chromium preinstalado (p. ej., entornos de Claude Code en la nube),
// se puede indicar con PW_CHROMIUM_PATH. En CI se usa el navegador instalado por Playwright.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath,
      // WebGL por software en navegadores headless.
      args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
    },
  },
  projects: [
    {
      name: 'desktop',
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', grep: /@mobile/, use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
