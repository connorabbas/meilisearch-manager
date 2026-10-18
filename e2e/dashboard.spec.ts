import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

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
