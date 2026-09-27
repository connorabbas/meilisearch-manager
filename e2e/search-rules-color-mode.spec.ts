import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test('search-rules availability is gated', async ({ page }) => {
    await installMeilisearchMock(page, { version: '1.40.0', dynamicSearchRules: false })
    await seedInstance(page)
    await page.goto('/search-rules')

    await expect(page.getByText('Dynamic Search Rules are not available')).toBeVisible()
    await expect(page.getByText('Your Meilisearch instance must be version 1.54.0 or higher')).toBeVisible()
    await expect(page.getByRole('link', { name: 'New Rule' })).toHaveCount(0)
})

test('supported search rules load', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/search-rules')

    await expect(page.getByRole('link', { name: 'New Rule' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'featured-movie' })).toBeVisible()
})

test('1.53 cannot create or edit rules even with the toggle enabled', async ({ page }) => {
    const requests: string[] = []
    await installMeilisearchMock(page, { version: '1.53.0', onDynamicSearchRulesRequest: request => requests.push(request.url()) })
    await seedInstance(page)
    for (const path of ['/search-rules', '/search-rules/create', '/search-rules/featured-movie/edit']) {
        await page.goto(path)
        await expect(page.getByText('Dynamic Search Rules are not available')).toBeVisible()
        await expect(page.getByText('1.54.0')).toBeVisible()
        if (path !== '/search-rules') await expect(page.getByRole('button', { name: 'Save Rule' })).toBeDisabled()
    }
    expect(requests).toEqual([])
})

test('1.54 prerelease and disabled toggle stay unavailable', async ({ page }) => {
    await installMeilisearchMock(page, { version: '1.54.0-rc.1', dynamicSearchRules: true })
    await seedInstance(page)
    await page.goto('/search-rules')
    await expect(page.getByText('Dynamic Search Rules are not available')).toBeVisible()
})

test('disabled DSR toggle blocks saving on 1.54', async ({ page }) => {
    await installMeilisearchMock(page, { dynamicSearchRules: false })
    await seedInstance(page)
    await page.goto('/search-rules/create')
    await expect(page.getByRole('button', { name: 'Save Rule' })).toBeDisabled()
    await expect(page.getByText('dynamicSearchRules')).toBeVisible()
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
