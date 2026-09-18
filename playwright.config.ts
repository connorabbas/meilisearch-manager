import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
    use: {
        baseURL: 'http://127.0.0.1:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
            },
        },
        {
            name: 'firefox',
            grep: /@cross-browser/,
            use: {
                ...devices['Desktop Firefox'],
                viewport: { width: 1440, height: 900 },
            },
        },
        {
            name: 'webkit',
            grep: /@cross-browser/,
            use: {
                ...devices['Desktop Safari'],
                viewport: { width: 375, height: 812 },
            },
        },
    ],
    webServer: {
        command: 'npm run preview -- --host=127.0.0.1 --port=3000',
        url: 'http://127.0.0.1:3000/up',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
