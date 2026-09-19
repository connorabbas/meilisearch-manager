import { expect, test } from '@playwright/test'
import { installMeilisearchMock, instance, secondaryInstance, seedInstance, seedInstances } from './fixtures/meilisearch'

test('mobile dashboard navigation is keyboard accessible and closes after navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /open sidebar/i }).click()
    await expect(page.getByRole('link', { name: 'Indexes', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Indexes', exact: true }).click()

    await expect(page).toHaveURL(/\/indexes$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('desktop sidebar preserves nested active routes and index breadcrumbs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/indexes/movies/settings')

    await expect(page.locator('#meilisearch-manager-dashboard-sidebar-main').getByRole('link', { name: 'Indexes', exact: true })).toHaveClass(/text-primary/)
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText('Dashboard')
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText('Indexes')
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText('movies')
    await expect(page.getByText('Settings', { exact: true }).last()).toBeVisible()
})

test('tablet dashboard uses the panel scroll container in dark mode', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /open sidebar/i }).click()
    await page.getByRole('button', { name: 'Color mode' }).click()
    await page.getByRole('option', { name: 'Dark' }).click()

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('#app-scroll-container')).toBeVisible()
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true)
})

test('multi-instance actions switch the active instance', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstances(page, [instance, secondaryInstance])
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'Playwright Instance' }).click()
    await page.getByRole('menuitem', { name: 'Change Instance' }).click()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Secondary Playwright Instance' }).click()
    await page.getByRole('button', { name: 'Change instance' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('button', { name: 'Secondary Playwright Instance' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('meilisearch-current-id'))).toBe(secondaryInstance.id)
})

test('single-instance proxy mode hides instance management but keeps color mode', async ({ page }) => {
    await installMeilisearchMock(page, { singleInstanceProxyMode: true })
    await page.goto('/dashboard')

    await expect(page.getByRole('button', { name: 'Playwright Instance' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Color mode' })).toBeVisible()
})
