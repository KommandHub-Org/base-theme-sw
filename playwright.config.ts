import { defineConfig, devices } from '@playwright/test';

/**
 * E2E suite for KmhBaseTheme. Runs against a live storefront that has the
 * theme assigned (default: the local dockware shop on http://localhost).
 *
 *   E2E_BASE_URL=https://staging.example.com npm run e2e
 *
 * Paths to demo-data pages can be overridden too — see tests/e2e/support.ts.
 */
export default defineConfig({
    testDir: 'tests/e2e',
    outputDir: 'tests/e2e/.results',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: true,
    // The dev shop runs with Xdebug; keep concurrency modest so timings stay sane.
    workers: process.env.CI ? 2 : 3,
    retries: process.env.CI ? 1 : 0,
    forbidOnly: !!process.env.CI,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'tests/e2e/.report', open: 'never' }],
    ],
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        // Registers one customer per run for the logged-in specs.
        { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
        {
            name: 'desktop',
            dependencies: ['setup'],
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
        },
        {
            name: 'mobile',
            dependencies: ['setup'],
            use: { ...devices['Pixel 7'] },
        },
    ],
});
