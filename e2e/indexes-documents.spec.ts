import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test.beforeEach(async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
})

test('an index opens and documents can be searched and paginated', async ({ page }) => {
    const searchRequests: Array<{ q?: string, offset?: number }> = []
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, {
        onSearchRequest: request => searchRequests.push(request.postDataJSON()),
    })

    await page.goto('/indexes')
    await expect(page.getByRole('cell', { name: 'movies', exact: true })).toBeVisible()
    await page.getByRole('row').filter({ hasText: 'movies' }).getByRole('link', { name: 'View' }).click()
    await expect(page).toHaveURL(/\/indexes\/movies$/)

    await page.getByRole('link', { name: 'Documents', exact: true }).click()
    await page.getByPlaceholder('search query').fill('Playwright')
    await expect.poll(() => searchRequests.some(request => request.q === 'Playwright')).toBe(true)
    await expect(page.getByText('"Playwright Movie"', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Next Page' }).last().click()
    await expect.poll(() => searchRequests.some(request => request.offset === 20)).toBe(true)
    await expect(page.getByText('"Page Two Movie"', { exact: true })).toBeVisible()
})

test('representative modal and drawer close with Escape', async ({ page }) => {
    await page.goto('/indexes')
    await page.getByRole('button', { name: 'New Index' }).click()
    await expect(page.getByRole('dialog', { name: 'New Index' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'New Index' })).toBeHidden()

    await page.goto('/indexes')
    await page.getByRole('row').filter({ hasText: 'movies' }).getByRole('link', { name: 'View' }).click()
    await page.getByRole('link', { name: 'Documents', exact: true }).click()
    await page.getByRole('button', { name: 'Import Documents' }).click()
    await expect(page.getByRole('button', { name: 'Choose file' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Choose file' })).toBeHidden()
})
