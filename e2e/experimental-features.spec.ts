import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

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
