import { expect, test } from '@playwright/test'
import { installMeilisearchMock, instance, seedInstance } from './fixtures/meilisearch'

test('instance setup validates fields and focuses the first invalid input', async ({ page }) => {
    await installMeilisearchMock(page)
    await page.goto('/new-instance')

    await page.getByLabel('Host URL').fill(instance.host)
    await page.getByLabel('API Key').fill(instance.apiKey)
    await page.getByRole('button', { name: 'Connect' }).click()

    await expect(page.getByText('Please provide a name for your instance')).toBeVisible()
    await expect(page.getByLabel('Name')).toBeFocused()
})

test('instance setup rejects duplicate hosts without replacing the saved instance', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/new-instance')

    await page.getByLabel('Name').fill('Duplicate instance')
    await page.getByLabel('Host URL').fill(instance.host)
    await page.getByLabel('API Key').fill('duplicate-key')
    await expect.poll(() => page.locator('form').evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(true)
    await page.getByRole('button', { name: 'Connect' }).click()

    await expect(page.getByText('Unable to add instance')).toBeVisible()
    await expect(page).toHaveURL(/\/new-instance$/)
    await expect.poll(() => page.evaluate(() => {
        return JSON.parse(localStorage.getItem('meilisearch-instances') ?? '[]').length
    })).toBe(1)
})

test('connection error can retry the current instance', async ({ page }) => {
    await installMeilisearchMock(page, { healthFailures: 1 })
    await seedInstance(page)
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/connection-error$/)
    await expect(page.locator('.app-scroll-container').getByText('Playwright fixture connection failure')).toBeVisible()
    await page.getByRole('button', { name: 'Retry Connection' }).first().click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Database Size')).toBeVisible()
})

test('single-instance proxy mode bypasses instance setup', async ({ page }) => {
    await installMeilisearchMock(page, { singleInstanceProxyMode: true })
    await page.goto('/new-instance')

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Database Size')).toBeVisible()
})

test('dashboard refreshes statistics on demand', async ({ page }) => {
    let statsRequests = 0
    await installMeilisearchMock(page, {
        onStatsRequest: () => statsRequests++,
    })
    await seedInstance(page)
    await page.goto('/dashboard')

    await expect(page.getByText('Database Size')).toBeVisible()
    await page.getByRole('button', { name: 'Refresh' }).click()
    await expect.poll(() => statsRequests).toBe(2)
})

test('backup actions call distinct endpoints and poll their tasks', async ({ page }) => {
    let dumpRequests = 0
    let snapshotRequests = 0
    await installMeilisearchMock(page, {
        onCreateDumpRequest: () => dumpRequests++,
        onCreateSnapshotRequest: () => snapshotRequests++,
    })
    await seedInstance(page)
    await page.goto('/backups/dumps')

    const scrollContainer = page.locator('.app-scroll-container')
    const createDump = page.getByRole('button', { name: 'Create Dump' })
    await expect(createDump).toBeVisible()
    await expect(scrollContainer.getByRole('button', { name: 'Create Dump' })).toHaveCount(0)
    await createDump.click()
    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('A new dump was successfully created')).toBeVisible()
    await expect.poll(() => dumpRequests).toBe(1)

    await page.locator('#meilisearch-manager-dashboard-panel-backups').getByRole('link', { name: 'Snapshots', exact: true }).click()
    const createSnapshot = page.getByRole('button', { name: 'Create Snapshot' })
    await expect(createDump).toHaveCount(0)
    await expect(createSnapshot).toBeVisible()
    await expect(scrollContainer.getByRole('button', { name: 'Create Snapshot' })).toHaveCount(0)
    await createSnapshot.click()
    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('A new snapshot was successfully created')).toBeVisible()
    await expect.poll(() => snapshotRequests).toBe(1)
})

test('experimental features submit every feature returned by Meilisearch', async ({ page }) => {
    let submittedFeatures: unknown
    await installMeilisearchMock(page, {
        experimentalFeatures: {
            dynamicSearchRules: true,
            metrics: false,
            logsRoute: null,
        },
        onExperimentalFeaturesRequest: request => submittedFeatures = request.postDataJSON(),
    })
    await seedInstance(page)
    await page.goto('/experimental-features')

    await page.getByRole('switch', { name: 'Dynamic Search Rules' }).click()
    await page.getByRole('switch', { name: 'Metrics' }).click()
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('Features Saved', { exact: true })).toBeVisible()
    await expect.poll(() => submittedFeatures).toEqual({
        dynamicSearchRules: false,
        metrics: true,
        logsRoute: false,
    })
})
