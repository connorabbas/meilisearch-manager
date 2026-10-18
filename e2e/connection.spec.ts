import { expect, test } from '@playwright/test'
import { installMeilisearchMock, instance, seedInstance } from './fixtures/meilisearch'

test('an empty configuration redirects to setup @cross-browser', async ({ page }) => {
    await installMeilisearchMock(page)
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/new-instance$/)
    await expect(page.getByText('Add a new Meilisearch instance connection')).toBeVisible()
})

test('a valid instance can be added and selected', async ({ page }) => {
    await installMeilisearchMock(page)
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
