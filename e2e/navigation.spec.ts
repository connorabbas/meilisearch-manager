import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test.beforeEach(async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
})

test('every top-level route is reachable from navigation @cross-browser', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Mobile navigation is covered by the dashboard-shell migration.')
    await page.goto('/dashboard')
    await expect(page.getByText('Database Size')).toBeVisible()

    const routes = [
        { link: 'Indexes', path: '/indexes', heading: 'Indexes' },
        { link: 'Tasks', path: '/tasks', heading: 'Tasks' },
        { link: 'Keys', path: '/keys', heading: 'API Keys' },
        { link: 'Backups', path: '/backups', heading: 'Backups' },
        { link: 'Search Rules', path: '/search-rules', heading: 'Search Rules' },
        { link: 'Experimental Features', path: '/experimental-features', heading: 'Experimental Features' },
    ]

    for (const route of routes) {
        await page.getByRole('link', { name: route.link, exact: true }).first().click()
        await expect(page).toHaveURL(new RegExp(`${route.path}$`))
        await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible()
    }

    await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Database Size')).toBeVisible()
})
