import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test.beforeEach(async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
})

test('the backups parent route redirects to its default child inside the dashboard shell', async ({ page }) => {
    await page.goto('/backups')

    await expect(page).toHaveURL(/\/backups\/dumps$/)
    await expect(page.getByRole('navigation', { name: 'breadcrumb' }).getByText('Dumps', { exact: true })).toBeVisible()
    await expect(page.getByText('Export a dump', { exact: true })).toBeVisible()
})

test('every top-level route is reachable from navigation @cross-browser', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Mobile navigation is covered by the dashboard-shell migration.')
    await page.goto('/dashboard')
    await expect(page.getByText('Database Size')).toBeVisible()

    const routes = [
        { link: 'Indexes', path: '/indexes', heading: 'Indexes' },
        { link: 'Tasks', path: '/tasks', heading: 'Tasks' },
        { link: 'Keys', path: '/keys', heading: 'Keys' },
        { link: 'Dumps', path: '/backups/dumps', heading: 'Dumps' },
        { link: 'Search Rules', path: '/search-rules', heading: 'Search Rules' },
        { link: 'Experimental Features', path: '/experimental-features', heading: 'Experimental Features' },
    ]

    for (const route of routes) {
        await page.getByRole('link', { name: route.link, exact: true }).first().click()
        await expect(page).toHaveURL(new RegExp(`${route.path}$`))
        if (route.path === '/indexes' || route.path.startsWith('/backups/') || route.path === '/experimental-features' || route.path === '/keys' || route.path === '/tasks' || route.path === '/search-rules') {
            await expect(page.getByRole('navigation', { name: 'breadcrumb' }).getByText(route.heading, { exact: true })).toBeVisible()
        } else {
            await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible()
        }
    }

    await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Database Size')).toBeVisible()
})
