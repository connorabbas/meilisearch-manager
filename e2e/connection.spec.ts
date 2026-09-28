import { expect, test } from '@playwright/test'
import { installMeilisearchMock, instance } from './fixtures/meilisearch'

test.beforeEach(async ({ page }) => {
    await installMeilisearchMock(page)
})

test('an empty configuration redirects to setup @cross-browser', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/new-instance$/)
    await expect(page.getByText('Add a new Meilisearch instance connection')).toBeVisible()
})

test('a valid instance can be added and selected', async ({ page }) => {
    await page.goto('/new-instance')
    await page.getByLabel('Name').fill(instance.name)
    await page.getByLabel('Host URL').fill(instance.host)
    await page.getByLabel('API Key').fill(instance.apiKey)
    await page.getByRole('button', { name: 'Connect' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Instance Added', { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => {
        const stored = JSON.parse(localStorage.getItem('meilisearch-instances') ?? '[]')
        const selectedId = localStorage.getItem('meilisearch-current-id')
        return stored[0]?.id === selectedId && stored[0]?.name
    })).toBe(instance.name)
})
