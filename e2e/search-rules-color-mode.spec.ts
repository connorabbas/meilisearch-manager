import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test('search-rules availability is gated', async ({ page }) => {
    await installMeilisearchMock(page, { version: '1.40.0', dynamicSearchRules: false })
    await seedInstance(page)
    await page.goto('/search-rules')

    await expect(page.getByText('Dynamic Search Rules are not available')).toBeVisible()
    await expect(page.getByText('Your Meilisearch instance must be version 1.41.0 or higher')).toBeVisible()
    await expect(page.getByRole('link', { name: 'New Rule' })).toHaveCount(0)
})

test('supported search rules load', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/search-rules')

    await expect(page.getByRole('link', { name: 'New Rule' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'featured-movie' })).toBeVisible()
})

test('color mode can be changed @cross-browser', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'Color mode' }).click()
    await page.getByRole('option', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('nuxt-color-mode'))).toBe('dark')
})
