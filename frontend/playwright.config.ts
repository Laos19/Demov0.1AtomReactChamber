import { defineConfig, devices } from '@playwright/test';

/** Pruebas end-to-end sobre el build de producción en modo demostración (sin servidor). */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  reporter: process.env.CI ? [['list'], ['junit']] : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'off' },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      // Permite usar un Chromium preinstalado (p. ej. contenedores sin descarga de navegadores).
      launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    },
  }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_API_URL: '' },
  },
});
